import { useEffect } from 'react';

import { connectSocket } from './socketClient';
import useRealtimeStore from '../stores/realtimeStore';
import {
  notifyNewCase,
  notifyEtaWarning,
  notifyBedUpdate,
  notifyAIReportReady,
  notifyDecision,
} from '../lib/notifications';
import { normalizeCase } from '../lib/utils';
import { playNewCaseChime, playSoftTick, flashTabTitle } from '../lib/alerts';

/// Connects the hospital dashboard socket, joins the hospital room, loads the
/// initial case/bed snapshot, and keeps the realtime store updated.
export function useHospitalSocket() {
  useEffect(() => {
    const store = useRealtimeStore.getState();
    const socket = connectSocket();

    const join = () => {
      socket
        .emitWithAck('hospital:join')
        .then((res) => {
          if (res?.success) {
            useRealtimeStore.getState().setInitialData({
              activeCases: res.activeCases,
              beds: res.beds,
            });
          }
        })
        .catch(() => {});
    };

    const onConnect = () => useRealtimeStore.getState().setLive(true);
    const onDisconnect = () => useRealtimeStore.getState().setLive(false);
    const onAuthenticated = () => join();

    const onNewCase = (data) => {
      const s = useRealtimeStore.getState();
      s.addCase(data);
      s.touch();
      notifyNewCase(data);

      // An ambulance is coming — make sure the desk notices.
      playNewCaseChime();
      flashTabTitle(useRealtimeStore.getState().activeCases.length);

      if (data?.type === 'redirected_in') {
        notifyDecision({
          tone: 'decision',
          title: 'Case redirected here',
          body: `From ${data.redirectedFrom || 'another hospital'}${data.reason ? ` — ${data.reason}` : ''}`,
          caseId: data.caseId,
        });
      }
    };

    const onCaseUpdate = (data) => {
      if (!data?.caseId) return;
      const s = useRealtimeStore.getState();

      if (data.type === 'ai_report_ready' && data.report) {
        s.updateCase(data.caseId, {
          has_ai_report: true,
          aiReport: data.report,
          urgency_level: data.report.urgencyLevel,
          emergency_type: data.report.emergencyType,
          pdf_url: data.pdfUrl ?? null,
          resources_needed: data.resourcesNeeded ?? [],
        });
        s.markNewReport(data.caseId);
        s.touch();
        playSoftTick();

        const existing = s.activeCases.find((x) => (x.id ?? x.caseId) === data.caseId);
        const c = existing ? normalizeCase(existing) : { patientName: 'Patient' };
        notifyAIReportReady(c.patientName, data.report.urgencyLevel);
        return;
      }

      // The patient chose a different hospital — this case is no longer ours.
      if (data.type === 'hospital_changed') {
        s.removeCase(data.caseId);
        s.touch();
        notifyDecision({
          tone: 'decision',
          title: 'Patient chose another hospital',
          body: data.newHospitalName
            ? `Now going to ${data.newHospitalName}`
            : 'This case moved to another hospital',
        });
        flashTabTitle(useRealtimeStore.getState().activeCases.length);
        return;
      }

      // This hospital redirected the case away — it belongs to someone else now.
      if (data.type === 'redirected_away') {
        s.removeCase(data.caseId);
        s.touch();
        notifyDecision({
          tone: 'ready',
          title: 'Case redirected',
          body: `Sent to ${data.newHospitalName || 'another hospital'}`,
        });
        flashTabTitle(useRealtimeStore.getState().activeCases.length);
        return;
      }

      s.updateCase(data.caseId, data);
      s.touch();
    };

    const onAmbulanceUpdate = (data) => {
      const s = useRealtimeStore.getState();
      s.touch();
      if (data?.driverId) {
        s.updateDriverPosition(data.driverId, {
          lat: data.driverLat,
          lng: data.driverLng,
          heading: data.heading,
        });
      }
      if (data?.caseId) {
        s.updateEta(data.caseId, {
          durationSeconds: data.durationSeconds,
          durationText: data.durationText,
        });
      }
    };

    const onEta = (data) => {
      if (!data?.caseId) return;
      const s = useRealtimeStore.getState();
      s.updateEta(data.caseId, {
        durationSeconds: data.durationSeconds,
        durationText: data.durationText,
      });
      s.touch();
      if (data.durationSeconds != null && data.durationSeconds < 120) {
        const c = s.activeCases.find((x) => (x.id ?? x.caseId) === data.caseId);
        notifyEtaWarning({ ...(c || {}), ...data });
      }
    };

    const onBed = (data) => {
      const s = useRealtimeStore.getState();
      s.upsertBed(data);
      s.touch();
      notifyBedUpdate(data);
    };

    // --- v2 decision events ---------------------------------------------------

    const onAccepted = (data) => {
      if (!data?.caseId) return;
      const s = useRealtimeStore.getState();
      s.updateCase(data.caseId, {
        hospital_decision: 'accepted',
        preparation_note: data.preparationNote ?? null,
        decision_at: data.timestamp,
      });
      s.touch();
    };

    const onRedirected = (data) => {
      if (!data?.caseId) return;
      const s = useRealtimeStore.getState();
      s.updateCase(data.caseId, {
        hospital_decision: 'redirected',
        redirect_reason: data.reason,
        decision_at: data.timestamp,
      });
      s.touch();
    };

    const onQuickMessage = (data) => {
      if (!data?.caseId) return;
      const s = useRealtimeStore.getState();
      s.appendMessage(data.caseId, {
        sender_role: data.senderRole,
        message_key: data.messageKey,
        message_text: data.messageText,
        created_at: data.timestamp,
      });
      s.touch();
      // Only the driver's replies need to pull attention.
      if (data.senderRole === 'driver') {
        playSoftTick();
        notifyDecision({
          tone: 'info',
          title: 'Message from driver',
          body: data.messageText,
          caseId: data.caseId,
        });
      }
    };

    const onResourcesUpdated = (data) => {
      const s = useRealtimeStore.getState();
      s.patchResource({
        canonicalKey: data?.canonicalKey,
        status: data?.status,
        quantity: data?.quantity,
        updatedAt: data?.updatedAt,
      });
      s.touch();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('authenticated', onAuthenticated);
    socket.on('hospital:new_case', onNewCase);
    socket.on('hospital:case_update', onCaseUpdate);
    socket.on('hospital:ambulance_update', onAmbulanceUpdate);
    socket.on('eta:update', onEta);
    socket.on('hospital:bed_status_changed', onBed);
    socket.on('case:accepted', onAccepted);
    socket.on('case:redirected', onRedirected);
    socket.on('case:quick_message', onQuickMessage);
    socket.on('hospital:resources_updated', onResourcesUpdated);

    // Already connected (e.g. fast reconnect) — sync immediately.
    if (socket.connected) {
      store.setLive(true);
      join();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('authenticated', onAuthenticated);
      socket.off('hospital:new_case', onNewCase);
      socket.off('hospital:case_update', onCaseUpdate);
      socket.off('hospital:ambulance_update', onAmbulanceUpdate);
      socket.off('eta:update', onEta);
      socket.off('hospital:bed_status_changed', onBed);
      socket.off('case:accepted', onAccepted);
      socket.off('case:redirected', onRedirected);
      socket.off('case:quick_message', onQuickMessage);
      socket.off('hospital:resources_updated', onResourcesUpdated);
    };
  }, []);
}

export default useHospitalSocket;

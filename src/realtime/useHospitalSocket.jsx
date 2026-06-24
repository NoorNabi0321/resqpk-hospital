import { useEffect } from 'react';
import { connectSocket } from './socketClient';
import useRealtimeStore from '../stores/realtimeStore';
import { notifyNewCase, notifyEtaWarning, notifyBedUpdate } from '../lib/notifications';

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
    };
    const onCaseUpdate = (data) => {
      if (data?.caseId) {
        const s = useRealtimeStore.getState();
        s.updateCase(data.caseId, data);
        s.touch();
      }
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
      if (data?.caseId) {
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
      }
    };
    const onBed = (data) => {
      const s = useRealtimeStore.getState();
      s.upsertBed(data);
      s.touch();
      notifyBedUpdate(data);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('authenticated', onAuthenticated);
    socket.on('hospital:new_case', onNewCase);
    socket.on('hospital:case_update', onCaseUpdate);
    socket.on('hospital:ambulance_update', onAmbulanceUpdate);
    socket.on('eta:update', onEta);
    socket.on('hospital:bed_status_changed', onBed);

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
    };
  }, []);
}

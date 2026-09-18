import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone, Mic, Square, Image as ImageIcon, FileText, Loader2, X } from 'lucide-react';

import { fetchTracking, fetchCase, fetchReport, submitDetails, cancelCase } from '../../api/public';
import { rememberCase, recentCases } from '../../lib/publicStorage';
import { connectCaseSocket } from '../../realtime/socketClient';

const MAP_STYLE = 'streets-v2';

const patientIcon = L.divIcon({
  className: 'resqpk-marker',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#DC2626;border:3px solid #fff;box-shadow:0 0 0 4px rgba(220,38,38,.25)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const hospitalIcon = L.divIcon({
  className: 'resqpk-marker',
  html: '<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:#059669;color:#fff;font-weight:700;font-size:20px;line-height:1;border:2px solid #fff">+</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const driverIcon = (heading = 0) =>
  L.divIcon({
    className: 'resqpk-marker',
    html: `<div style="width:34px;height:34px;border-radius:50%;background:#2563EB;display:flex;align-items:center;justify-content:center;border:2px solid #fff;font-size:18px;transform:rotate(${heading}deg)">🚑</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

// Plain language, not system vocabulary. Someone frightened is reading this.
const STATUS = {
  pending: { text: 'Sending your request…', tone: 'info' },
  searching: { text: 'Finding the nearest ambulance…', tone: 'info' },
  driver_assigned: { text: 'Ambulance on the way', tone: 'info' },
  arrived: { text: 'The ambulance has reached you', tone: 'ready' },
  en_route: { text: 'On the way to hospital', tone: 'decision' },
  completed: { text: 'Arrived at hospital', tone: 'ready' },
  cancelled: { text: 'This request was cancelled', tone: 'muted' },
  no_driver_found: { text: 'No ambulance was available', tone: 'critical' },
};

const URGENCY_TONE = {
  critical: 'bg-critical-tint text-critical border-critical/30',
  moderate: 'bg-decision-tint text-decision border-decision/30',
  low: 'bg-ready-tint text-ready border-ready/30',
};

function FitPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
    if (valid.length === 1) map.setView(valid[0], 15);
    else if (valid.length > 1) map.fitBounds(valid, { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
}

const num = (v) => (v == null || v === '' ? null : Number(v));

/** Both entry points produce the same view model. */
function fromTracking(d, caseId) {
  return {
    caseId: d.caseId || caseId,
    caseNumber: d.caseNumber || null,
    status: d.status,
    patient: d.patientLocation
      ? { lat: num(d.patientLocation.lat), lng: num(d.patientLocation.lng) }
      : null,
    driver: d.driverLocation
      ? { lat: num(d.driverLocation.lat), lng: num(d.driverLocation.lng), heading: d.driverLocation.heading }
      : null,
    hospital: d.hospitalLocation
      ? { name: d.hospitalName, lat: num(d.hospitalLocation.lat), lng: num(d.hospitalLocation.lng) }
      : d.hospitalName
        ? { name: d.hospitalName }
        : null,
    etaSeconds: d.etaSeconds ?? null,
  };
}

function fromCase(c) {
  const driver = c.driver || null;
  return {
    caseId: c.id,
    caseNumber: c.case_number,
    status: c.status,
    patient: { lat: num(c.patient_lat), lng: num(c.patient_lng) },
    driver: driver
      ? {
          lat: num(driver.current_lat),
          lng: num(driver.current_lng),
          heading: driver.heading,
          name: driver.users?.full_name,
          phone: driver.users?.phone,
          vehicle: driver.vehicle_number,
        }
      : null,
    hospital: c.hospital
      ? { name: c.hospital.name, lat: num(c.hospital.lat), lng: num(c.hospital.lng) }
      : null,
    etaSeconds: c.estimated_driver_arrival_seconds ?? null,
  };
}

export default function TrackPage() {
  const { token, caseId: caseIdParam } = useParams();

  const queryClient = useQueryClient();

  const [view, setView] = useState(null);
  // Held separately from `view` so the callbacks below memoize on plain values.
  const [caseId, setCaseId] = useState(caseIdParam || null);
  const [caseToken, setCaseToken] = useState(null);
  const [freshReport, setFreshReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // "Add details" panel
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const recorderRef = useRef(null);

  // --- initial load ---------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (token) {
          const data = await fetchTracking(token);
          if (cancelled) return;
          setCaseToken(data.caseToken);
          setCaseId(data.caseId);
          setView(fromTracking(data));
          rememberCase({
            caseId: data.caseId,
            caseToken: data.caseToken,
            caseNumber: data.caseNumber,
            shareToken: token,
          });
        } else {
          const saved = recentCases().find((c) => c.caseId === caseIdParam);
          if (!saved?.caseToken) {
            setError('This request is not saved on this device. Open your tracking link instead.');
            setLoading(false);
            return;
          }
          const c = await fetchCase(caseIdParam, saved.caseToken);
          if (cancelled) return;
          setCaseToken(saved.caseToken);
          setView(fromCase(c));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.status === 404
              ? 'This tracking link has expired or is not valid.'
              : 'Could not load this request.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, caseIdParam]);

  const refreshCase = useCallback(async () => {
    if (!caseId || !caseToken) return;
    try {
      setView(fromCase(await fetchCase(caseId, caseToken)));
    } catch {
      /* a refresh failure is not worth interrupting the map for */
    }
  }, [caseId, caseToken]);

  // The report arrives minutes after the case, so it is polled rather than
  // loaded once — and stops polling as soon as it is finished.
  const { data: polledReport } = useQuery({
    queryKey: ['public-report', caseId],
    queryFn: () => fetchReport(caseId, caseToken),
    enabled: Boolean(caseId && caseToken),
    refetchInterval: (query) =>
      query.state.data?.generation_status === 'completed' ? false : 20000,
  });

  const report =
    freshReport || (polledReport?.generation_status === 'completed' ? polledReport : null);

  // --- live updates ---------------------------------------------------------
  useEffect(() => {
    if (!caseToken || !caseId) return undefined;
    const socket = connectCaseSocket(caseToken);

    const patchDriver = (d) =>
      setView((v) =>
        v ? { ...v, driver: { ...(v.driver || {}), lat: num(d.lat), lng: num(d.lng), heading: d.heading } } : v,
      );

    socket.on('driver:location_broadcast', patchDriver);
    socket.on('eta:update', (d) => setView((v) => (v ? { ...v, etaSeconds: d.durationSeconds ?? v.etaSeconds } : v)));
    socket.on('emergency:driver_assigned', refreshCase);
    socket.on('emergency:driver_changed', refreshCase);
    socket.on('emergency:driver_arrived', () => setView((v) => (v ? { ...v, status: 'arrived' } : v)));
    socket.on('emergency:driver_en_route', () => setView((v) => (v ? { ...v, status: 'en_route' } : v)));
    socket.on('emergency:case_completed', () => setView((v) => (v ? { ...v, status: 'completed' } : v)));
    socket.on('emergency:case_cancelled', () => setView((v) => (v ? { ...v, status: 'cancelled' } : v)));
    socket.on('emergency:no_driver_found', () => setView((v) => (v ? { ...v, status: 'no_driver_found' } : v)));
    socket.on('emergency:hospital_changed', (d) =>
      setView((v) =>
        v ? { ...v, hospital: { name: d.hospitalName, lat: num(d.hospitalLat), lng: num(d.hospitalLng) } } : v,
      ),
    );
    socket.on('ai:report_ready', () =>
      queryClient.invalidateQueries({ queryKey: ['public-report', caseId] }),
    );

    return () => socket.close();
  }, [caseToken, caseId, refreshCase, queryClient]);

  // --- voice note -----------------------------------------------------------
  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setSubmitError('Microphone not available. Type the details instead.');
    }
  }

  async function sendDetails() {
    if (!text.trim() && !audioBlob && !imageFile) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitDetails({
        caseId,
        caseToken,
        text: text.trim() || null,
        audioBlob,
        imageFile,
      });
      setText('');
      setAudioBlob(null);
      setImageFile(null);
      setFreshReport({
        generation_status: 'completed',
        urgency_level: result.urgencyLevel,
        emergency_type: result.emergencyType,
        first_aid_suggestion: result.firstAidSuggestion,
        key_observations: result.keyObservations,
        pdf_url: result.pdfUrl,
      });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Could not send those details. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const points = useMemo(
    () =>
      [
        view?.patient && [view.patient.lat, view.patient.lng],
        view?.driver?.lat != null && [view.driver.lat, view.driver.lng],
        view?.hospital?.lat != null && [view.hospital.lat, view.hospital.lng],
      ].filter((p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1])),
    [view],
  );

  const status = STATUS[view?.status] || { text: 'Tracking your ambulance', tone: 'info' };
  const etaMin = view?.etaSeconds ? Math.max(1, Math.round(view.etaSeconds / 60)) : null;
  const canCancel = ['pending', 'searching', 'driver_assigned'].includes(view?.status);
  const isOver = ['completed', 'cancelled', 'no_driver_found'].includes(view?.status);

  return (
    <div className="min-h-screen bg-page flex justify-center">
      <div className="w-full max-w-[480px] bg-card min-h-screen flex flex-col shadow-card">
        <header className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div>
            <p className="font-bold text-[17px] text-ink">ResQPK</p>
            <p className="text-[12px] text-ink-muted">
              {view?.caseNumber ? `Request ${view.caseNumber}` : 'Live tracking'}
            </p>
          </div>
          <a href="tel:1122" className="flex items-center gap-1.5 text-[13px] font-semibold text-critical">
            <Phone size={15} /> 1122
          </a>
        </header>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-ink-muted text-[14px] gap-2">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-2">
            <p className="text-[17px] font-semibold text-ink">Cannot open this request</p>
            <p className="text-[13px] text-ink-muted">{error}</p>
            <a href="tel:1122" className="mt-3 rounded-card bg-critical text-white px-5 py-2.5 text-[14px] font-semibold">
              Call 1122
            </a>
          </div>
        ) : (
          <>
            <div className="h-[320px] bg-page">
              {points.length > 0 && (
                <MapContainer center={points[0]} zoom={14} style={{ width: '100%', height: '100%' }}>
                  <TileLayer
                    url={`https://api.maptiler.com/maps/${MAP_STYLE}/{z}/{x}/{y}@2x.png?key=${import.meta.env.VITE_MAPTILER_KEY}`}
                    tileSize={512}
                    zoomOffset={-1}
                    attribution="© MapTiler © OpenStreetMap"
                  />
                  {view.patient && <Marker position={[view.patient.lat, view.patient.lng]} icon={patientIcon} />}
                  {view.driver?.lat != null && (
                    <Marker position={[view.driver.lat, view.driver.lng]} icon={driverIcon(view.driver.heading ?? 0)} />
                  )}
                  {view.hospital?.lat != null && (
                    <Marker position={[view.hospital.lat, view.hospital.lng]} icon={hospitalIcon} />
                  )}
                  <FitPoints points={points} />
                </MapContainer>
              )}
            </div>

            <div className="px-5 py-4 space-y-4 flex-1">
              {/* Status */}
              <div className="rounded-card border border-line shadow-card p-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      status.tone === 'critical'
                        ? 'bg-critical'
                        : status.tone === 'ready'
                          ? 'bg-ready'
                          : status.tone === 'decision'
                            ? 'bg-decision'
                            : status.tone === 'muted'
                              ? 'bg-ink-faint'
                              : 'bg-info animate-pulse'
                    }`}
                  />
                  <p className="text-[17px] font-semibold text-ink">{status.text}</p>
                </div>
                {etaMin != null && !isOver && (
                  <p className="text-[14px] text-ink-soft mt-2">
                    Arriving in about <span className="font-semibold text-ink">{etaMin} min</span>
                  </p>
                )}
                {view.hospital?.name && (
                  <p className="text-[14px] text-ink-soft mt-1">
                    Hospital: <span className="font-medium text-ink">{view.hospital.name}</span>
                  </p>
                )}
                {view.status === 'no_driver_found' && (
                  <p className="text-[13px] text-ink-soft mt-2">
                    Call Rescue 1122, Edhi 115 or Chhipa 1020 now.
                  </p>
                )}
              </div>

              {/* Driver */}
              {view.driver?.name && (
                <div className="rounded-card border border-line shadow-card p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-ink">{view.driver.name}</p>
                    <p className="text-[13px] text-ink-muted">{view.driver.vehicle || 'Ambulance'}</p>
                  </div>
                  {view.driver.phone && (
                    <a
                      href={`tel:${view.driver.phone}`}
                      className="flex items-center gap-1.5 rounded-card bg-ready text-white px-4 py-2.5 text-[14px] font-semibold"
                    >
                      <Phone size={15} /> Call
                    </a>
                  )}
                </div>
              )}

              {/* AI patient overview */}
              {report ? (
                <div className="rounded-card border border-line shadow-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-semibold text-ink">Patient report</p>
                    {report.urgency_level && (
                      <span
                        className={`text-[12px] font-semibold px-2 py-0.5 rounded-full border ${
                          URGENCY_TONE[report.urgency_level] || 'bg-page text-ink-muted border-line'
                        }`}
                      >
                        {report.urgency_level}
                      </span>
                    )}
                  </div>
                  {report.emergency_type && (
                    <p className="text-[13px] text-ink-soft mt-1">{report.emergency_type}</p>
                  )}
                  {report.first_aid_suggestion && (
                    <p className="text-[13px] text-ink-soft mt-2">
                      <span className="font-semibold text-ink">While you wait: </span>
                      {report.first_aid_suggestion}
                    </p>
                  )}
                  <p className="text-[12px] text-ink-muted mt-2">The hospital has received this.</p>
                  {report.pdf_url && (
                    <a
                      href={report.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-info"
                    >
                      <FileText size={15} /> Open the full report
                    </a>
                  )}
                </div>
              ) : (
                !isOver && (
                  <div className="rounded-card border border-line shadow-card p-4">
                    <p className="text-[15px] font-semibold text-ink">Tell the hospital what happened</p>
                    <p className="text-[12px] text-ink-muted mt-0.5">
                      What is wrong, is the patient awake, any bleeding. They receive it before the
                      ambulance arrives.
                    </p>

                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      placeholder="Motorcycle accident, man bleeding from the head, awake but confused…"
                      className="mt-3 w-full rounded-card border border-line px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-info/40"
                    />

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`flex items-center gap-1.5 rounded-card border px-3 py-2 text-[13px] font-medium ${
                          recording ? 'border-critical text-critical bg-critical-tint' : 'border-line text-ink-soft'
                        }`}
                      >
                        {recording ? <Square size={14} /> : <Mic size={14} />}
                        {recording ? 'Stop' : 'Voice note'}
                      </button>

                      <label className="flex items-center gap-1.5 rounded-card border border-line px-3 py-2 text-[13px] font-medium text-ink-soft cursor-pointer">
                        <ImageIcon size={14} />
                        Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        />
                      </label>

                      {(audioBlob || imageFile) && (
                        <button
                          type="button"
                          onClick={() => {
                            setAudioBlob(null);
                            setImageFile(null);
                          }}
                          className="flex items-center gap-1 text-[12px] text-ink-muted"
                        >
                          <X size={13} /> clear
                        </button>
                      )}
                    </div>

                    {(audioBlob || imageFile) && (
                      <p className="text-[12px] text-ready mt-2">
                        {audioBlob ? 'Voice note ready. ' : ''}
                        {imageFile ? 'Photo ready.' : ''}
                      </p>
                    )}
                    {submitError && <p className="text-[12px] text-critical mt-2">{submitError}</p>}

                    <button
                      type="button"
                      onClick={sendDetails}
                      disabled={submitting || (!text.trim() && !audioBlob && !imageFile)}
                      className="mt-3 w-full rounded-card bg-info text-white font-semibold py-3 text-[15px] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Preparing report…
                        </>
                      ) : (
                        'Send to hospital'
                      )}
                    </button>
                  </div>
                )
              )}

              {canCancel && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Cancel this ambulance request?')) return;
                    try {
                      await cancelCase(caseId, caseToken);
                      setView((v) => ({ ...v, status: 'cancelled' }));
                    } catch {
                      setSubmitError('Could not cancel. Call 1122 if this was a mistake.');
                    }
                  }}
                  className="w-full text-[13px] text-ink-muted py-2"
                >
                  Cancel this request
                </button>
              )}
            </div>
          </>
        )}

        <footer className="px-5 py-3 border-t border-line text-center">
          <p className="text-[11px] text-ink-faint">
            Anyone with this link can see this request. Do not share it publicly.
          </p>
        </footer>
      </div>
    </div>
  );
}

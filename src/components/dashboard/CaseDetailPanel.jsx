import { AnimatePresence, motion } from 'framer-motion';
import { X, Phone, BedDouble, Download, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

import StatusBadge from '../ui/StatusBadge';
import LiveMapPanel from './LiveMapPanel';
import useRealtimeStore from '../../stores/realtimeStore';
import useAuthStore from '../../stores/authStore';
import { normalizeCase, formatTime, formatDuration } from '../../lib/utils';

function Section({ title, children }) {
  return (
    <div className="px-4 py-3 border-b border-gray-100">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return '—';
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

function downloadReport(c) {
  const lines = [
    `ResQPK Emergency Case Report`,
    `============================`,
    `Case: ${c.caseNumber ?? '—'}`,
    `Status: ${c.status ?? '—'}`,
    `Triggered: ${c.sosTriggeredAt ? new Date(c.sosTriggeredAt).toLocaleString('en-PK') : '—'}`,
    ``,
    `PATIENT`,
    `  Name: ${c.patientName ?? '—'}`,
    `  Phone: ${c.patientPhone ?? '—'}`,
    `  Blood Group: ${c.bloodGroup ?? '—'}`,
    `  Conditions: ${(c.conditions ?? []).join(', ') || 'None'}`,
    `  Allergies: ${(c.allergies ?? []).join(', ') || 'None'}`,
    ``,
    `AI TRIAGE REPORT`,
    `  Urgency: ${c.urgency ?? '—'}`,
    `  Type: ${c.emergencyType ?? '—'}`,
    `  Consciousness: ${c.consciousness ?? '—'}`,
    `  Observations:`,
    ...((c.keyObservations ?? []).length
      ? c.keyObservations.map((o) => `    - ${o}`)
      : ['    - None recorded']),
    `  First Aid: ${c.firstAidSuggestion ?? '—'}`,
    ``,
    `DRIVER`,
    `  Name: ${c.driverName ?? 'Unassigned'}`,
    `  Vehicle: ${c.vehicle ?? '—'}`,
    `  Phone: ${c.driverPhone ?? '—'}`,
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${c.caseNumber ?? 'case'}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

const TIMELINE = [
  { key: 'sosTriggeredAt', label: 'SOS Triggered' },
  { key: 'driverAssignedAt', label: 'Driver Assigned' },
  { key: 'driverArrivedAt', label: 'Ambulance Arrived' },
];

export default function CaseDetailPanel({ selectedCaseId, caseData, onClose }) {
  const activeCases = useRealtimeStore((s) => s.activeCases);
  const driverPositions = useRealtimeStore((s) => s.driverPositions);
  const etaByCase = useRealtimeStore((s) => s.etaByCase);
  const hospital = useAuthStore((s) => s.hospital);

  // Prefer an explicitly-passed case (e.g. from the Cases list, which may hold
  // completed cases not in the live store); fall back to the live store.
  const rawCase =
    caseData ?? activeCases.find((x) => (x.id ?? x.caseId) === selectedCaseId);
  const c = rawCase ? normalizeCase(rawCase) : null;
  const eta = c ? (etaByCase[c.id]?.durationSeconds ?? c.etaSeconds) : null;
  const lastUpdate = c ? driverPositions[c.driverId]?.updatedAt : null;

  return (
    <AnimatePresence>
      {selectedCaseId && c && (
        <motion.aside
          key={selectedCaseId}
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          className="fixed right-0 top-14 bottom-0 w-[380px] bg-white border-l border-gray-200 overflow-y-auto z-40 shadow-xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-start justify-between">
            <div>
              <p className="text-xs font-mono text-gray-400">{c.caseNumber}</p>
              <div className="mt-1">
                <StatusBadge level={c.urgency} />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Triggered {formatTime(c.sosTriggeredAt)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Patient */}
          <Section title="Patient">
            <p className="font-semibold text-[15px] text-gray-900">{c.patientName}</p>
            <p className="text-[13px] text-gray-500">{c.emergencyType ?? '—'}</p>
          </Section>

          {/* AI Report */}
          <Section title="AI Triage Report">
            {c.hasAiReport ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="rounded-xl bg-gray-50 p-2.5"
                  >
                    <p className="text-[10px] text-gray-400">Urgency</p>
                    <p className="text-sm font-semibold capitalize text-gray-800">{c.urgency}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-xl bg-gray-50 p-2.5"
                  >
                    <p className="text-[10px] text-gray-400">Consciousness</p>
                    <p className="text-sm font-semibold capitalize text-gray-800">
                      {c.consciousness ?? '—'}
                    </p>
                  </motion.div>
                </div>
                {(c.keyObservations ?? []).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-xl bg-gray-50 p-2.5"
                  >
                    <p className="text-[10px] text-gray-400 mb-1">Key Observations</p>
                    <ul className="text-[13px] text-gray-700 list-disc list-inside space-y-0.5">
                      {c.keyObservations.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
                {c.firstAidSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl bg-emergency-green/5 border border-emergency-green/20 p-2.5"
                  >
                    <p className="text-[10px] text-emergency-green font-semibold mb-0.5">
                      First Aid Suggestion
                    </p>
                    <p className="text-[13px] text-gray-700">{c.firstAidSuggestion}</p>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-gray-50 p-3 animate-pulse">
                <p className="text-[13px] text-gray-400">Awaiting AI report…</p>
              </div>
            )}
          </Section>

          {/* Medical Profile */}
          <Section title="Medical Profile">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emergency-red/10 flex items-center justify-center shrink-0">
                <span className="text-emergency-red font-bold text-sm">{c.bloodGroup ?? '?'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(c.conditions ?? []).map((cond) => (
                  <span
                    key={cond}
                    className="text-xs px-2 py-0.5 rounded-full bg-emergency-amber/10 text-emergency-amber"
                  >
                    {cond}
                  </span>
                ))}
                {(c.allergies ?? []).map((a) => (
                  <span
                    key={a}
                    className="text-xs px-2 py-0.5 rounded-full bg-emergency-red/10 text-emergency-red"
                  >
                    ⚠ {a}
                  </span>
                ))}
                {!(c.conditions ?? []).length && !(c.allergies ?? []).length && (
                  <span className="text-[13px] text-gray-400">No known conditions</span>
                )}
              </div>
            </div>
          </Section>

          {/* Live Tracking */}
          <Section title="Live Tracking">
            <div className="rounded-xl overflow-hidden border border-gray-200 h-[200px]">
              <LiveMapPanel
                activeCases={[rawCase]}
                hospitalLat={hospital?.lat != null ? Number(hospital.lat) : undefined}
                hospitalLng={hospital?.lng != null ? Number(hospital.lng) : undefined}
                driverPositions={driverPositions}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[13px]">
              <span className="flex items-center gap-1 text-gray-600">
                <MapPin size={14} /> ETA {formatDuration(eta)}
              </span>
              <span className="text-gray-400 text-xs">Updated {timeAgo(lastUpdate)}</span>
            </div>
          </Section>

          {/* Actions */}
          <Section title="Actions">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toast('Bed management coming soon')}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emergency-green/10 text-emergency-green text-sm font-medium py-2.5 hover:bg-emergency-green/20"
              >
                <BedDouble size={16} /> Assign Bed
              </button>
              <button
                onClick={() => downloadReport(c)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium py-2.5 hover:bg-gray-200"
              >
                <Download size={16} /> Report
              </button>
              <button
                onClick={() => {
                  if (c.driverPhone) window.location.href = `tel:${c.driverPhone}`;
                  else toast.error('No driver phone available');
                }}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl bg-emergency-red/10 text-emergency-red text-sm font-medium py-2.5 hover:bg-emergency-red/20"
              >
                <Phone size={16} /> Call Driver
              </button>
            </div>
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            <ol className="relative border-l border-gray-200 ml-1.5 space-y-3 py-1">
              {TIMELINE.map((t) => {
                const ts = c[t.key];
                return (
                  <li key={t.key} className="ml-4">
                    <span
                      className={`absolute -left-[5px] w-2.5 h-2.5 rounded-full ${
                        ts ? 'bg-emergency-green' : 'bg-gray-300'
                      }`}
                    />
                    <p className={`text-[13px] ${ts ? 'text-gray-800' : 'text-gray-400'}`}>
                      {t.label}
                    </p>
                    {ts && <p className="text-[11px] text-gray-400">{formatTime(ts)}</p>}
                  </li>
                );
              })}
            </ol>
          </Section>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

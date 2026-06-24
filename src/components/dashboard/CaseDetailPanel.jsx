import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Phone, BedDouble, Download, MapPin, Clock, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

import StatusBadge from '../ui/StatusBadge';
import LiveMapPanel from './LiveMapPanel';
import useRealtimeStore from '../../stores/realtimeStore';
import useAuthStore from '../../stores/authStore';
import { normalizeCase, formatTime, formatDuration } from '../../lib/utils';

const URGENCY_EMOJI = { critical: '🔴', moderate: '🟡', low: '🟢' };

function urgencyClasses(u) {
  if (u === 'critical') return 'bg-emergency-red/15 border-l-emergency-red text-emergency-red';
  if (u === 'moderate') return 'bg-emergency-amber/15 border-l-emergency-amber text-emergency-amber';
  if (u === 'low') return 'bg-emergency-green/15 border-l-emergency-green text-emergency-green';
  return 'bg-gray-100 border-l-gray-300 text-gray-500';
}

function ReportCard({ delay = 0, className = '', children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-xl p-2.5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Full AI report display: waiting → processing → complete states.
function AIReportSection({ c }) {
  const [showConditions, setShowConditions] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Processing
  if (c.generationStatus === 'processing') {
    return (
      <div className="rounded-xl border border-chart-one/40 p-3 animate-pulse space-y-2">
        <p className="text-[13px] text-chart-one">AI is analyzing the emergency…</p>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  // No report yet
  if (!c.hasAiReport) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-4 flex items-center gap-2 text-gray-400">
        <Clock size={16} />
        <span className="text-[13px]">Waiting for AI report…</span>
      </div>
    );
  }

  const langLabel = c.transcribedText
    ? `Voice: ${(c.inputLanguage ?? 'auto').toUpperCase()}`
    : `Text: ${(c.inputLanguage ?? 'EN').toUpperCase()}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {c.generationTimeMs != null && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emergency-green/10 text-emergency-green">
            Generated in {(c.generationTimeMs / 1000).toFixed(1)}s
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
          {langLabel}
        </span>
      </div>

      {/* Urgency banner */}
      <ReportCard delay={0.05} className={`border-l-4 ${urgencyClasses(c.urgency)}`}>
        <p className="text-sm font-bold">
          {URGENCY_EMOJI[c.urgency] ?? '⚪'} {(c.urgency ?? 'unknown').toUpperCase()}
        </p>
        <p className="text-[13px] text-gray-700">{c.emergencyType ?? '—'}</p>
      </ReportCard>

      {/* Consciousness + vitals */}
      <ReportCard delay={0.11} className="bg-gray-50">
        <p className="text-[13px] text-gray-700">👁 Consciousness: {c.consciousness ?? '—'}</p>
        {c.bloodGroup && <p className="text-[13px] text-gray-700">🩸 Blood: {c.bloodGroup}</p>}
        {(c.medicationsMentioned ?? []).length > 0 && (
          <p className="text-[13px] text-gray-700">
            💊 Medications: {c.medicationsMentioned.join(', ')}
          </p>
        )}
      </ReportCard>

      {/* Key observations */}
      {(c.keyObservations ?? []).length > 0 && (
        <ReportCard delay={0.17} className="bg-gray-50">
          <p className="text-[10px] text-gray-400 mb-1">📋 Key Observations</p>
          <ul className="text-[13px] text-gray-700 list-disc list-inside space-y-0.5">
            {c.keyObservations.slice(0, 5).map((o, i) => (
              <li key={i} className="line-clamp-2">{o}</li>
            ))}
          </ul>
        </ReportCard>
      )}

      {/* Hospital preparation */}
      {c.hospitalPreparation && (
        <ReportCard delay={0.23} className="bg-emergency-green/5 border border-emergency-green/20">
          <p className="text-[10px] text-emergency-green font-semibold mb-0.5">
            🏥 Hospital Should Prepare
          </p>
          <p className="text-[13px] text-gray-700">{c.hospitalPreparation}</p>
        </ReportCard>
      )}

      {/* First aid */}
      {c.firstAidSuggestion && (
        <ReportCard delay={0.29} className="bg-chart-one/5 border border-chart-one/20">
          <p className="text-[10px] text-chart-one font-semibold mb-0.5">💊 First Aid</p>
          <p className="text-[13px] text-gray-700">{c.firstAidSuggestion}</p>
        </ReportCard>
      )}

      {/* Possible conditions (collapsible) */}
      {(c.possibleConditions ?? []).length > 0 && (
        <div className="rounded-xl bg-gray-50 p-2.5">
          <button
            onClick={() => setShowConditions((v) => !v)}
            className="flex items-center justify-between w-full text-[13px] text-gray-700"
          >
            <span>Possible Conditions</span>
            <ChevronDown
              size={15}
              className={`transition-transform ${showConditions ? 'rotate-180' : ''}`}
            />
          </button>
          {showConditions && (
            <div className="mt-1.5">
              <ul className="text-[13px] text-gray-700 list-disc list-inside space-y-0.5">
                {c.possibleConditions.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              <p className="text-[10px] text-gray-400 italic mt-1">
                AI assessment only — clinical judgment required
              </p>
            </div>
          )}
        </div>
      )}

      {/* Transcription (collapsible) */}
      {c.transcribedText && (
        <div className="rounded-xl bg-gray-50 p-2.5">
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="flex items-center justify-between w-full text-[13px] text-gray-700"
          >
            <span>🎤 Voice transcription</span>
            <ChevronDown
              size={15}
              className={`transition-transform ${showTranscript ? 'rotate-180' : ''}`}
            />
          </button>
          {showTranscript && (
            <p className="text-[13px] text-gray-600 italic mt-1.5">{c.transcribedText}</p>
          )}
        </div>
      )}
    </div>
  );
}

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
          <Section title="AI Emergency Report">
            <AIReportSection c={c} />
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

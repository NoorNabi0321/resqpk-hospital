import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, FileText } from 'lucide-react';

import { formatEtaClock } from '../../lib/utils';

const URGENCY_STYLES = {
  critical: 'bg-critical-tint text-critical',
  moderate: 'bg-decision-tint text-decision',
  low: 'bg-ready-tint text-ready',
  unknown: 'bg-gray-100 text-ink-muted',
};

function Chip({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-ink-soft',
    red: 'bg-critical-tint text-critical',
    amber: 'bg-decision-tint text-decision',
    blue: 'bg-info-tint text-info',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// The left edge encodes the single most important fact about the card.
function edgeClass(c) {
  if (c.decision === 'accepted') return 'border-l-4 border-l-ready';
  if (c.urgency === 'critical') return 'border-l-4 border-l-critical';
  return 'border-l-4 border-l-decision';
}

function ReportLine({ c, isNew }) {
  if (isNew) {
    return (
      <span className="inline-flex items-center gap-1.5 text-decision font-medium animate-pulse-thrice">
        <FileText size={13} /> New report — review now
      </span>
    );
  }
  if (c.hasAiReport) {
    return (
      <span className="inline-flex items-center gap-1.5 text-ready">
        <FileText size={13} /> Report received ✓
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-faint">
      <FileText size={13} /> No report yet
    </span>
  );
}

function DecisionLine({ c }) {
  if (c.decision === 'accepted') {
    return (
      <span className="text-ready font-medium">
        Accepted ✓{c.preparationNote ? ` · ${c.preparationNote}` : ''}
      </span>
    );
  }
  if (c.decision === 'redirected') {
    return <span className="text-ink-muted">Redirected →</span>;
  }
  return <span className="text-decision font-medium">Awaiting your decision</span>;
}

function AmbulanceCard({ c, etaSeconds, isNewReport, hasArrived }) {
  const navigate = useNavigate();

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={`v2-card ${hasArrived ? 'border-l-4 border-l-ready bg-ready-tint' : edgeClass(c)} p-5 min-h-[150px] flex flex-col gap-3`}
    >
      {/* Row 1 — triage priority + the number that matters most */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${
              URGENCY_STYLES[c.urgency] || URGENCY_STYLES.unknown
            }`}
          >
            {c.urgency || 'unknown'}
          </span>
          <span className="text-sm text-ink-soft">{c.emergencyType || 'Assessing…'}</span>
        </div>

        <div className="text-right shrink-0">
          {hasArrived ? (
            <div className="text-eta text-ready">ARRIVED</div>
          ) : (
            <>
              <div className="text-eta tabular-nums text-ink">{formatEtaClock(etaSeconds)}</div>
              <div className="text-[11px] text-ink-faint -mt-0.5">ETA</div>
            </>
          )}
        </div>
      </div>

      {/* Row 2 — who is coming */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-card-title">{c.patientName}</span>
        {(c.gender || c.age != null) && (
          <span className="text-sm text-ink-muted">
            {[c.gender, c.age != null ? `${c.age}` : null].filter(Boolean).join(' · ')}
          </span>
        )}
        {c.bloodGroup && <Chip tone="red">{c.bloodGroup}</Chip>}
        {(c.conditions || []).slice(0, 2).map((cond) => (
          <Chip key={cond}>{cond}</Chip>
        ))}
      </div>

      {/* Row 3 — who to expect at the gate */}
      <div className="text-sm text-ink-muted">
        Driver: {c.driverName || 'Assigning…'}
        {c.vehicle ? ` · ${c.vehicle}` : ''}
      </div>

      {/* Row 4 — report + decision status, then the only action */}
      <div className="flex items-end justify-between gap-4 mt-auto">
        <div className="flex flex-col gap-1 text-xs">
          <ReportLine c={c} isNew={isNewReport} />
          <DecisionLine c={c} />
        </div>

        <button
          onClick={() => navigate(`/case/${c.id}`)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-info text-white text-sm font-medium hover:brightness-95 transition shrink-0"
        >
          Open Case <ArrowRight size={15} />
        </button>
      </div>
    </motion.article>
  );
}

export default memo(AmbulanceCard);

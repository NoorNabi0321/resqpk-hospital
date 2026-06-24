import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import StatusBadge from '../ui/StatusBadge';
import ETABar from '../ui/ETABar';
import { cn, formatDuration } from '../../lib/utils';

export default function CaseCard({ caseData, isSelected, onClick, etaSeconds }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const created = caseData.sosTriggeredAt ? new Date(caseData.sosTriggeredAt).getTime() : 0;
    if (created && Date.now() - created < 8000) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 2000);
      return () => clearTimeout(t);
    }
  }, [caseData.sosTriggeredAt]);

  const urgency = caseData.urgency;
  const borderColor =
    urgency === 'critical'
      ? 'border-l-emergency-red'
      : urgency === 'moderate'
        ? 'border-l-emergency-amber'
        : urgency === 'low'
          ? 'border-l-emergency-green'
          : 'border-l-gray-300';
  const ringColor =
    urgency === 'moderate'
      ? 'ring-emergency-amber'
      : urgency === 'low'
        ? 'ring-emergency-green'
        : 'ring-emergency-red';

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl p-3.5 border-l-4 cursor-pointer card-hover',
        borderColor,
        isSelected && `ring-2 ${ringColor}`,
        flash && 'animate-pulse',
      )}
    >
      <div className="flex items-center justify-between">
        <StatusBadge level={urgency} />
        <span className="text-sm font-medium text-gray-700">{formatDuration(etaSeconds)}</span>
      </div>

      <div className="mt-2">
        <p className="font-semibold text-[15px] text-gray-900">{caseData.patientName}</p>
        <p className="text-[13px] text-gray-500">{caseData.emergencyType ?? '—'}</p>
      </div>

      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {caseData.bloodGroup && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emergency-red/10 text-emergency-red">
              {caseData.bloodGroup}
            </span>
          )}
          {(caseData.conditions ?? []).slice(0, 2).map((c) => (
            <span
              key={c}
              className="text-xs px-2 py-0.5 rounded-full bg-emergency-amber/10 text-emergency-amber"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="text-right shrink-0">
          {caseData.driverName && (
            <p className="text-xs text-gray-500">Driver: {caseData.driverName}</p>
          )}
          <p className="text-[10px] text-gray-400 font-mono">{caseData.caseNumber}</p>
        </div>
      </div>

      <div className="mt-2.5">
        <ETABar initialSeconds={Math.max(etaSeconds ?? 0, 360)} currentSeconds={etaSeconds ?? 0} />
      </div>
    </motion.div>
  );
}

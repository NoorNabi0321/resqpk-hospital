import useRealtimeStore from '../../stores/realtimeStore';
import CaseCard from './CaseCard';
import { normalizeCase } from '../../lib/utils';

const urgencyRank = { critical: 0, moderate: 1, low: 2, unknown: 3 };

export default function CaseFeed({ cases = [], onCaseSelect, selectedCaseId, showHeader = true }) {
  const etaByCase = useRealtimeStore((s) => s.etaByCase);

  const normalized = cases.map(normalizeCase);
  normalized.sort((a, b) => {
    const u = (urgencyRank[a.urgency] ?? 3) - (urgencyRank[b.urgency] ?? 3);
    if (u !== 0) return u;
    const ea = etaByCase[a.id]?.durationSeconds ?? a.etaSeconds ?? 1e9;
    const eb = etaByCase[b.id]?.durationSeconds ?? b.etaSeconds ?? 1e9;
    return ea - eb;
  });

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="flex items-center justify-between px-1 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">Active Cases</h2>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emergency-red/10 text-emergency-red">
            {normalized.length}
          </span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {normalized.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No active cases right now.</p>
        ) : (
          normalized.map((c) => (
            <CaseCard
              key={c.id}
              caseData={c}
              isSelected={c.id === selectedCaseId}
              onClick={() => onCaseSelect?.(c.id)}
              etaSeconds={etaByCase[c.id]?.durationSeconds ?? c.etaSeconds}
            />
          ))
        )}
      </div>
    </div>
  );
}

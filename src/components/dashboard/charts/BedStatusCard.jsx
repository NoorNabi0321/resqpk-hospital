const BED_LABELS = {
  general: 'General',
  icu: 'ICU',
  trauma: 'Trauma',
  pediatric: 'Pediatric',
  maternity: 'Maternity',
};

function BedBar({ label, bed }) {
  const total = Number(bed?.total_count ?? 0);
  const available = Number(bed?.available_count ?? 0);
  const reserved = Number(bed?.reserved_count ?? 0);
  const occupied = Math.max(total - available - reserved, 0);
  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="font-medium text-gray-600">{label}</span>
        <span className="text-gray-400">{available} / {total} available</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
        <div
          className="bg-emergency-green transition-all duration-500"
          style={{ width: `${pct(available)}%` }}
        />
        <div
          className="bg-emergency-amber transition-all duration-500"
          style={{ width: `${pct(reserved)}%` }}
        />
        <div
          className="bg-emergency-red transition-all duration-500"
          style={{ width: `${pct(occupied)}%` }}
        />
      </div>
    </div>
  );
}

export default function BedStatusCard({ beds = [], onManage }) {
  const byType = Object.fromEntries(beds.map((b) => [b.bed_type, b]));
  // Show every bed type that exists for this hospital, in a stable order.
  const types = Object.keys(BED_LABELS).filter((k) => byType[k]);

  return (
    <div className="flex flex-col h-full">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
        Bed Status
      </span>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-0.5">
        {types.map((key) => (
          <BedBar key={key} label={BED_LABELS[key]} bed={byType[key]} />
        ))}
      </div>
      <button
        onClick={onManage}
        className="mt-1.5 text-xs font-medium text-chart-one hover:underline self-start"
      >
        Manage Beds
      </button>
    </div>
  );
}

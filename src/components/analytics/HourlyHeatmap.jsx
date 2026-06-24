const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const HOUR_LABELS = { 0: '00:00', 6: '06:00', 12: '12:00', 18: '18:00' };

export default function HourlyHeatmap({ data = [] }) {
  const maxCount = Math.max(1, ...data.flatMap((row) => DAYS.map((d) => row[d.key] || 0)));

  return (
    <div className="flex gap-2">
      {/* Hour axis — pt offset matches the day-header row, gap matches the grid */}
      <div className="grid gap-1 pt-[18px]" style={{ gridTemplateRows: 'repeat(24, 1fr)' }}>
        {data.map((row) => (
          <div key={row.hour} className="h-[9px] text-[9px] text-gray-400 leading-[9px] pr-1 text-right w-9">
            {HOUR_LABELS[row.hour] ?? ''}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d) => (
            <div key={d.key} className="text-[10px] text-gray-400 text-center">
              {d.label}
            </div>
          ))}
        </div>
        <div
          className="grid grid-cols-7 gap-1"
          style={{ gridTemplateRows: 'repeat(24, 1fr)' }}
        >
          {data.map((row) =>
            DAYS.map((d) => {
              const count = row[d.key] || 0;
              return (
                <div
                  key={`${row.hour}-${d.key}`}
                  title={`${d.label} ${String(row.hour).padStart(2, '0')}:00 — ${count} case${count === 1 ? '' : 's'}`}
                  className="h-[9px] rounded-[2px] border border-gray-50"
                  style={{
                    backgroundColor:
                      count === 0 ? '#F9FAFB' : `rgba(239,68,68,${Math.min(1, count / maxCount)})`,
                  }}
                />
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// No historical bed snapshots exist yet, so we render the current totals as a
// flat 24-hour line (Module 5 spec: "If no historical data: show current status
// as a flat line"). Hourly snapshots can replace this later.
export default function BedOccupancyChart({ beds = [] }) {
  const available = beds.reduce((s, b) => s + Number(b.available_count ?? 0), 0);
  const occupied = beds.reduce((s, b) => {
    const total = Number(b.total_count ?? 0);
    const avail = Number(b.available_count ?? 0);
    const reserved = Number(b.reserved_count ?? 0);
    return s + Math.max(total - avail - reserved, 0);
  }, 0);

  const now = new Date();
  const data = Array.from({ length: 24 }, (_, i) => {
    const h = (now.getHours() - (23 - i) + 24) % 24;
    return { time: `${String(h).padStart(2, '0')}:00`, available, occupied };
  });

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emergency-green" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emergency-red" /> Occupied
        </span>
        <span className="ml-auto text-gray-400">current snapshot</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9CA3AF' }} interval={5} />
          <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} allowDecimals={false} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="available"
            stackId="1"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.3}
          />
          <Area
            type="monotone"
            dataKey="occupied"
            stackId="1"
            stroke="#EF4444"
            fill="#EF4444"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

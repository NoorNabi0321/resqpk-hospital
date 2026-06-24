import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function WeeklyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg bg-gray-900 text-white text-xs px-2.5 py-1.5 shadow-lg">
      <span className="font-semibold">{label}</span>: {p.avgMinutes} min avg • {p.cases} cases
    </div>
  );
}

export default function WeeklyBarChart({ data = [] }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
        <span className="inline-block w-2.5 h-2.5 rounded-sm bg-chart-one" />
        Avg response time (min)
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
          <Tooltip content={<WeeklyTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Bar dataKey="avgMinutes" fill="#6366F1" radius={[4, 4, 0, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

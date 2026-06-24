import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import AnimatedNumber from '../../ui/AnimatedNumber';

// TODO (Module 5 F1): replace mock with GET /api/analytics/response-times?limit=10
const MOCK = [
  { case: '#1035', minutes: 8.2 },
  { case: '#1036', minutes: 6.5 },
  { case: '#1037', minutes: 9.1 },
  { case: '#1038', minutes: 7.3 },
  { case: '#1039', minutes: 5.8 },
];

function RtTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg bg-gray-900 text-white text-xs px-2.5 py-1.5 shadow-lg">
      {p.case}: <span className="font-semibold">{p.minutes} min</span>
    </div>
  );
}

export default function ResponseTimeChart({ data = MOCK }) {
  const rows = data.length ? data : MOCK;
  const avg = rows.reduce((s, r) => s + r.minutes, 0) / rows.length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Avg Response
        </span>
        <span className="text-sm font-bold text-emergency-green">
          <AnimatedNumber value={Number(avg.toFixed(1))} suffix=" min" duration={1} />
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={rows} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="case" tick={{ fontSize: 9, fill: '#9CA3AF' }} height={20} />
            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip content={<RtTooltip />} />
            <ReferenceLine
              y={avg}
              stroke="#F59E0B"
              strokeDasharray="3 3"
              label={{ value: 'avg', fontSize: 9, fill: '#F59E0B', position: 'right' }}
            />
            <Line
              type="monotone"
              dataKey="minutes"
              stroke="#10B981"
              strokeWidth={2}
              dot={{ fill: '#10B981', r: 3 }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Last {rows.length} completed</p>
    </div>
  );
}

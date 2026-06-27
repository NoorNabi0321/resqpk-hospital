import { useQuery } from '@tanstack/react-query';
import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import apiClient from '../../../api/client';
import AnimatedNumber from '../../ui/AnimatedNumber';

function RtTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg bg-gray-900 text-white text-xs px-2.5 py-1.5 shadow-lg">
      <span className="font-semibold">{label}</span>: {p.avgMinutes} min • {p.cases} cases
    </div>
  );
}

// Real weekly response times (last 7 days), matching the Analytics tab.
export default function ResponseTimeChart() {
  const { data } = useQuery({
    queryKey: ['analytics', 'weekly-response-times'],
    queryFn: async () => (await apiClient.get('/api/analytics/weekly-response-times')).data.data,
    refetchInterval: 60000,
  });

  const rows = data ?? [];
  const withCases = rows.filter((r) => r.cases > 0);
  const avg = withCases.length
    ? Math.round((withCases.reduce((s, r) => s + r.avgMinutes, 0) / withCases.length) * 10) / 10
    : 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Avg Response
        </span>
        <span className="text-sm font-bold text-emergency-green">
          <AnimatedNumber value={avg} suffix=" min" duration={1} />
        </span>
      </div>
      <div className="flex-1 min-h-0">
        {withCases.length === 0 ? (
          <p className="text-xs text-gray-400 flex items-center justify-center h-full">
            No completed cases yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={rows} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#9CA3AF' }} height={20} />
              <YAxis hide domain={[0, 'dataMax + 1']} />
              <Tooltip content={<RtTooltip />} />
              <ReferenceLine
                y={avg}
                stroke="#F59E0B"
                strokeDasharray="3 3"
                label={{ value: 'avg', fontSize: 9, fill: '#F59E0B', position: 'right' }}
              />
              <Line
                type="monotone"
                dataKey="avgMinutes"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 3 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Last 7 days</p>
    </div>
  );
}

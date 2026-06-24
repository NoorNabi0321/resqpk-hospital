import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { normalizeCase } from '../../../lib/utils';

function EtaTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg bg-gray-900 text-white text-xs px-2.5 py-1.5 shadow-lg">
      Case {p.name}: <span className="font-semibold">{p.eta} min</span>
    </div>
  );
}

export default function ETATimelineChart({ activeCases = [] }) {
  const data = activeCases.map((raw) => {
    const c = normalizeCase(raw);
    return {
      name: c.caseNumber,
      eta: Math.round((c.etaSeconds || 0) / 60),
      urgency: c.urgency,
    };
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          ETA Overview
        </span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-chart-one/10 text-chart-one">
          {data.length}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        {data.length === 0 ? (
          <p className="text-xs text-gray-400 flex items-center justify-center h-full">
            No active ambulances
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="etaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: '#9CA3AF' }}
                angle={-45}
                textAnchor="end"
                height={28}
                interval={0}
              />
              <YAxis hide />
              <Tooltip content={<EtaTooltip />} />
              <Area
                type="monotone"
                dataKey="eta"
                stroke="#6366F1"
                fill="url(#etaGradient)"
                strokeWidth={2}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="text-[11px] text-gray-400 mt-1">{data.length} ambulances tracked</p>
    </div>
  );
}

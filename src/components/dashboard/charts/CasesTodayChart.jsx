import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

import AnimatedNumber from '../../ui/AnimatedNumber';
import { normalizeCase } from '../../../lib/utils';

const COLORS = {
  Critical: '#EF4444',
  Moderate: '#F59E0B',
  Low: '#10B981',
  Unknown: '#9CA3AF',
};

export default function CasesTodayChart({ activeCases = [] }) {
  const counts = { Critical: 0, Moderate: 0, Low: 0, Unknown: 0 };
  activeCases.forEach((raw) => {
    const u = normalizeCase(raw).urgency;
    if (u === 'critical') counts.Critical += 1;
    else if (u === 'moderate') counts.Moderate += 1;
    else if (u === 'low') counts.Low += 1;
    else counts.Unknown += 1;
  });

  const total = activeCases.length;
  const data = Object.entries(counts)
    .map(([name, value]) => ({ name, value, fill: COLORS[name] }))
    .filter((d) => d.value > 0);
  const chartData = data.length ? data : [{ name: 'Unknown', value: 1, fill: '#E5E7EB' }];

  return (
    <div className="flex flex-col h-full">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
        Cases Today
      </span>
      <div className="flex-1 flex items-center gap-2 min-h-0">
        <div className="relative w-[120px] h-[120px] shrink-0">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                animationBegin={0}
                animationDuration={800}
                stroke="none"
              >
                {chartData.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-900 leading-none">
              <AnimatedNumber value={total} duration={1} />
            </span>
            <span className="text-[9px] text-gray-400">total</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          {Object.entries(counts).map(([name, value]) => (
            <div key={name} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: COLORS[name] }}
              />
              <span className="text-gray-500">{name}</span>
              <span className="font-semibold text-gray-800 ml-auto">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';

const PALETTE = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#9CA3AF'];

export default function TypeDonutChart({ data = [] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const rows = data.map((d, i) => ({ ...d, fill: PALETTE[i % PALETTE.length] }));
  const chartData = rows.length ? rows : [{ type: 'No data', count: 1, fill: '#E5E7EB' }];

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[180px] h-[180px] shrink-0">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="type"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
              animationDuration={800}
            >
              {chartData.map((d) => (
                <Cell key={d.type} fill={d.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-900 leading-none">{total}</span>
          <span className="text-[10px] text-gray-400">cases</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 text-xs flex-1 min-w-0">
        {rows.length === 0 ? (
          <span className="text-gray-400">No cases this month.</span>
        ) : (
          rows.map((d) => (
            <div key={d.type} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: d.fill }} />
              <span className="text-gray-600 truncate">{d.type}</span>
              <span className="font-semibold text-gray-800 ml-auto shrink-0">
                {total ? Math.round((d.count / total) * 100) : 0}%
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

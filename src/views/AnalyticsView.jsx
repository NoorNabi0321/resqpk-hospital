import { useQuery } from '@tanstack/react-query';

import apiClient from '../api/client';
import GlassCard from '../components/ui/GlassCard';
import AnimatedNumber from '../components/ui/AnimatedNumber';
import WeeklyBarChart from '../components/analytics/WeeklyBarChart';
import TypeDonutChart from '../components/analytics/TypeDonutChart';
import HourlyHeatmap from '../components/analytics/HourlyHeatmap';
import BedOccupancyChart from '../components/analytics/BedOccupancyChart';
import useRealtimeStore from '../stores/realtimeStore';

function useAnalytics(key, path) {
  return useQuery({
    queryKey: ['analytics', key],
    queryFn: async () => (await apiClient.get(`/api/analytics/${path}`)).data.data,
    refetchInterval: 60000,
  });
}

function Skeleton({ height = 220 }) {
  return <div className="w-full rounded-xl bg-gray-100 animate-pulse" style={{ height }} />;
}

function MetricCard({ label, value, suffix = '' }) {
  return (
    <GlassCard hover={false}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">
        <AnimatedNumber value={value ?? 0} suffix={suffix} />
      </p>
    </GlassCard>
  );
}

function ChartCard({ title, children }) {
  return (
    <GlassCard hover={false}>
      <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </GlassCard>
  );
}

export default function AnalyticsView() {
  const overview = useAnalytics('overview', 'overview');
  const weekly = useAnalytics('weekly', 'weekly-response-times');
  const types = useAnalytics('types', 'emergency-types');
  const heatmap = useAnalytics('heatmap', 'hourly-heatmap');
  const beds = useRealtimeStore((s) => s.beds);

  const o = overview.data;

  return (
    <div className="p-6 space-y-4">
      {/* Overview metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Total Today" value={o?.totalCasesToday} />
        <MetricCard label="Active Now" value={o?.activeCases} />
        <MetricCard label="Avg Response" value={o?.avgResponseTimeMinutes} suffix=" min" />
        <MetricCard label="Resolved" value={o?.resolvedCases} />
      </div>

      {/* Bento grid of charts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ChartCard title="Weekly Response Times">
            {weekly.isLoading ? <Skeleton /> : <WeeklyBarChart data={weekly.data ?? []} />}
          </ChartCard>
        </div>
        <ChartCard title="Emergency Types (This Month)">
          {types.isLoading ? <Skeleton height={180} /> : <TypeDonutChart data={types.data ?? []} />}
        </ChartCard>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ChartCard title="Bed Occupancy (24h)">
            <BedOccupancyChart beds={beds} />
          </ChartCard>
        </div>
        <ChartCard title="Hourly Heatmap (This Month)">
          {heatmap.isLoading ? <Skeleton height={250} /> : <HourlyHeatmap data={heatmap.data ?? []} />}
        </ChartCard>
      </div>
    </div>
  );
}

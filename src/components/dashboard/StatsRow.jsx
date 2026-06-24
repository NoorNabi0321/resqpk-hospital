import GlassCard from '../ui/GlassCard';
import ETATimelineChart from './charts/ETATimelineChart';
import ResponseTimeChart from './charts/ResponseTimeChart';
import CasesTodayChart from './charts/CasesTodayChart';
import BedStatusCard from './charts/BedStatusCard';
import useRealtimeStore from '../../stores/realtimeStore';

export default function StatsRow({ onManageBeds }) {
  const activeCases = useRealtimeStore((s) => s.activeCases);
  const beds = useRealtimeStore((s) => s.beds);

  return (
    <div className="grid grid-cols-4 gap-4">
      <GlassCard hover={false} className="h-[160px]">
        <ETATimelineChart activeCases={activeCases} />
      </GlassCard>
      <GlassCard hover={false} className="h-[160px]">
        <ResponseTimeChart />
      </GlassCard>
      <GlassCard hover={false} className="h-[160px]">
        <CasesTodayChart activeCases={activeCases} />
      </GlassCard>
      <GlassCard hover={false} className="h-[160px]">
        <BedStatusCard beds={beds} onManage={onManageBeds} />
      </GlassCard>
    </div>
  );
}

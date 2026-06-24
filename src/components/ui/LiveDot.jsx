import { cn } from '../../lib/utils';

export default function LiveDot({ isLive = true, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn('w-2 h-2 rounded-full', isLive ? 'bg-emergency-green animate-pulse' : 'bg-gray-400')}
      />
      <span className="text-xs font-medium text-gray-600">
        {label || (isLive ? 'Live' : 'Disconnected')}
      </span>
    </div>
  );
}

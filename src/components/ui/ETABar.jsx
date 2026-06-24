import { cn, formatDuration } from '../../lib/utils';

export default function ETABar({ initialSeconds = 600, currentSeconds, label }) {
  const progress =
    initialSeconds > 0 ? Math.max(0, Math.min(1, 1 - currentSeconds / initialSeconds)) : 0;
  const isUrgent = (currentSeconds ?? 0) < 120; // under 2 min

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500">{label || 'ETA'}</span>
        <span
          className={cn(
            'text-sm font-medium transition-colors duration-500',
            isUrgent ? 'text-emergency-red' : 'text-gray-700',
          )}
        >
          {formatDuration(currentSeconds)}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-out',
            isUrgent ? 'bg-emergency-red' : 'bg-emergency-amber',
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

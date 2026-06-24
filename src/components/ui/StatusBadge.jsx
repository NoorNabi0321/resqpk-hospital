import { cn, getUrgencyColor } from '../../lib/utils';

export default function StatusBadge({ level, size = 'sm' }) {
  const colors = getUrgencyColor(level);
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        colors.bg,
        colors.text,
        colors.border,
        sizes[size],
      )}
    >
      <span
        className={cn('w-1.5 h-1.5 rounded-full mr-1.5', {
          'bg-emergency-red animate-pulse': level === 'critical',
          'bg-emergency-amber': level === 'moderate',
          'bg-emergency-green': level === 'low',
        })}
      />
      {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Unknown'}
    </span>
  );
}

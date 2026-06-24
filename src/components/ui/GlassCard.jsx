import { cn } from '../../lib/utils';

export default function GlassCard({
  children,
  className = '',
  urgency = null, // 'critical' | 'moderate' | 'low' | null
  hover = true,
  padding = true,
  dark = false,
}) {
  const urgencyBorder = {
    critical: 'border-l-4 border-l-emergency-red',
    moderate: 'border-l-4 border-l-emergency-amber',
    low: 'border-l-4 border-l-emergency-green',
  };
  return (
    <div
      className={cn(
        dark ? 'glass-dark' : 'glass',
        'rounded-2xl',
        padding && 'p-4',
        hover && 'card-hover cursor-default',
        urgency && urgencyBorder[urgency],
        className,
      )}
    >
      {children}
    </div>
  );
}

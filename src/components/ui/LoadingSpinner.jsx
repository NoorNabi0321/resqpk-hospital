import { cn } from '../../lib/utils';

// Border classes are written as literals so Tailwind's scanner keeps them.
const borderByColor = {
  'emergency-red': 'border-emergency-red',
  'emergency-green': 'border-emergency-green',
  'emergency-blue': 'border-emergency-blue',
  white: 'border-white',
  gray: 'border-gray-400',
};

export default function LoadingSpinner({ size = 'md', color = 'emergency-red' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-t-transparent',
        sizes[size],
        borderByColor[color] ?? borderByColor['emergency-red'],
      )}
    />
  );
}

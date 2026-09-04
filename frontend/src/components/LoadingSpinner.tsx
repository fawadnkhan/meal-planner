import { cn } from '@/lib/utils';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

export function LoadingSpinner({ size = 'md', className, label = 'Loading…' }: Props) {
  return (
    <div className={cn('flex items-center justify-center', className)} role="status" aria-label={label}>
      <div
        className={cn(
          sizes[size],
          'border-4 border-brand-600 border-t-transparent rounded-full animate-spin'
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

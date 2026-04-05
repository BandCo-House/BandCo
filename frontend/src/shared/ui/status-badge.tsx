import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

type StatusBadgeColor = 'primary' | 'secondary' | 'accent' | 'success' | 'destructive';

const colorClassNames: Record<StatusBadgeColor, string> = {
  primary:
    'border-transparent bg-primary-surface text-primary',
  secondary:
    'border-transparent bg-secondary-surface text-secondary-foreground',
  accent:
    'border-transparent bg-accent-surface text-accent-light',
  success:
    'border-transparent bg-success-surface text-success',
  destructive:
    'border-transparent bg-destructive-surface text-destructive',
};

interface StatusBadgeProps extends ComponentProps<'span'> {
  color?: StatusBadgeColor;
}

export const StatusBadge = ({
  className,
  color = 'primary',
  ...props
}: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        'typo-xs-sb inline-flex items-center rounded-full border px-2.5 py-1',
        colorClassNames[color],
        className,
      )}
      {...props}
    />
  );
};

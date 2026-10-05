import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type BadgeTone = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';

const TONE_CLASSES: Record<BadgeTone, string> = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

export const Badge = ({ tone = 'gray', className, children }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset',
      TONE_CLASSES[tone],
      className,
    )}
  >
    {children}
  </span>
);

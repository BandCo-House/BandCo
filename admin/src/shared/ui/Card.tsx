import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export const Card = ({
  title,
  description,
  actions,
  className,
  bodyClassName,
  children,
}: CardProps) => (
  <section
    className={cn(
      'rounded-lg border border-slate-200 bg-white shadow-sm',
      className,
    )}
  >
    {(title || actions) && (
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-3">
        <div>
          {title && (
            <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          )}
          {description && (
            <p className="mt-0.5 text-xs text-slate-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
    )}
    <div className={cn('p-5', bodyClassName)}>{children}</div>
  </section>
);

interface InfoListProps {
  items: ReadonlyArray<{ label: string; value: ReactNode }>;
  columns?: 1 | 2 | 3;
}

const INFO_COLUMN_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
} as const;

/** 상세 화면의 라벨-값 목록 */
export const InfoList = ({ items, columns = 2 }: InfoListProps) => (
  <dl className={cn('grid gap-x-6 gap-y-3', INFO_COLUMN_CLASSES[columns])}>
    {items.map((item) => (
      <div key={item.label} className="min-w-0">
        <dt className="text-xs text-slate-500">{item.label}</dt>
        <dd className="mt-0.5 text-sm break-all text-slate-900">
          {item.value}
        </dd>
      </div>
    ))}
  </dl>
);

import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

export const Table = ({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) => (
  <div className="overflow-x-auto">
    <table
      className={cn('w-full border-collapse text-left text-sm', className)}
      {...props}
    />
  </div>
);

export const THead = (props: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="border-b border-slate-200 bg-slate-50" {...props} />
);

export const TBody = (props: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="divide-y divide-slate-100" {...props} />
);

interface TrProps extends HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export const Tr = ({ clickable = false, className, ...props }: TrProps) => (
  <tr
    className={cn(clickable && 'cursor-pointer hover:bg-slate-50', className)}
    {...props}
  />
);

export const Th = ({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      'px-3 py-2 text-xs font-semibold whitespace-nowrap text-slate-500',
      className,
    )}
    {...props}
  />
);

export const Td = ({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn('px-3 py-2.5 align-middle text-slate-700', className)}
    {...props}
  />
);

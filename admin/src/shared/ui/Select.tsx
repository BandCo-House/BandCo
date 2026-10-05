import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: ReadonlyArray<SelectOption>;
}

export const Select = ({ options, className, ...props }: SelectProps) => (
  <select
    className={cn(
      'h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500',
      className,
    )}
    {...props}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react';

import { cn } from '@/shared/lib/cn';

const CONTROL_CLASS =
  'w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500';

export const Input = ({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(CONTROL_CLASS, 'h-9', className)} {...props} />
);

export const Textarea = ({
  className,
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    rows={rows}
    className={cn(CONTROL_CLASS, 'py-2', className)}
    {...props}
  />
);

interface FieldProps {
  label: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** 라벨·도움말과 입력 컨트롤을 묶는다. */
export const Field = ({ label, hint, className, children }: FieldProps) => (
  <label className={cn('flex flex-col gap-1.5', className)}>
    <span className="text-xs font-medium text-slate-600">{label}</span>
    {children}
    {hint && <span className="text-xs text-slate-500">{hint}</span>}
  </label>
);

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  label: string;
}

export const Checkbox = ({ label, className, ...props }: CheckboxProps) => (
  <label
    className={cn(
      'inline-flex items-center gap-2 text-sm text-slate-700',
      className,
    )}
  >
    <input
      type="checkbox"
      className="size-4 rounded border-slate-300 accent-slate-900"
      {...props}
    />
    {label}
  </label>
);

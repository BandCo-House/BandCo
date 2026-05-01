import React, { useId } from 'react';
import { cn } from '@/shared/lib/utils';
import { Input } from './input';

interface FloatingInputProps extends React.ComponentProps<'input'> {
  label: string;
  containerClassName?: string;
  labelClassName?: string;
  ref?: React.Ref<HTMLInputElement>;
}

export function FloatingInput({
  label,
  containerClassName,
  labelClassName,
  className,
  id,
  ref,
  ...props
}: FloatingInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  {
    /* css의 높이 radius등의 경우 추후 옵션으로 분리 현재는 일단 h-14로 통일 */
  }
  return (
    <fieldset
      className={cn(
        'group relative w-full border-2 rounded-[14px] px-3 transition-colors duration-200 bg-white',
        'border-transparent focus-within:border-slate-900',
        containerClassName,
      )}
    >
      <legend
        aria-hidden="true"
        className={cn(
          'ml-2 px-1 text-sm font-bold text-slate-900 bg-transparent opacity-0 transition-opacity duration-200 pointer-events-none select-none',
          'group-focus-within:opacity-100',
          labelClassName,
        )}
      >
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
      </legend>

      <Input
        id={inputId}
        ref={ref}
        {...props}
        className={cn(
          'h-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:border-0 w-full -mt-2 pb-2 px-1',
          className,
        )}
      />
    </fieldset>
  );
}

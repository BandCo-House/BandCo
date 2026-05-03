import React, { useId } from 'react';
import { cn } from '@/shared/lib/utils';
import { Input } from './input';

interface FloatingInputProps extends React.ComponentProps<'input'> {
  label: string;
  containerClassName?: string;
  labelClassName?: string;
  variant?: React.ComponentProps<typeof Input>['variant'];
  ref?: React.Ref<HTMLInputElement>;
}

/**
 * 레이블이 포커스 시 테두리 위로 떠오르는 입력 필드를 렌더링한다.
 */
export const FloatingInput = ({
  label,
  containerClassName,
  labelClassName,
  className,
  id,
  variant = 'roundedFull',
  ref,
  ...props
}: FloatingInputProps) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hasAccessibleName = Boolean(
    props['aria-label'] || props['aria-labelledby'],
  );
  const inputProps = hasAccessibleName ? props : { ...props, 'aria-label': label };
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
        {label}
      </legend>

      <Input
        id={inputId}
        ref={ref}
        variant={variant}
        {...inputProps}
        className={cn(
          'h-12 bg-transparent border-0 focus-visible:ring-0 focus-visible:border-0 w-full -mt-2 pb-2 px-1',
          className,
        )}
      />
    </fieldset>
  );
};

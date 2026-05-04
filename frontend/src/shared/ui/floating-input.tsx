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
  const inputProps = hasAccessibleName
    ? props
    : { ...props, 'aria-label': label };
  {
    /* css의 높이 radius등의 경우 추후 옵션으로 분리 현재는 일단 h-14로 통일 */
  }
  return (
    <fieldset
      className={cn(
        'group relative w-full rounded-[14px] border-2 bg-background px-3 transition-colors duration-200',
        'border-transparent focus-within:border-primary-light',
        containerClassName,
      )}
    >
      <legend
        aria-hidden="true"
        className={cn(
          'pointer-events-none ml-2 bg-transparent px-1 text-sm font-bold text-foreground opacity-0 transition-opacity duration-200 select-none',
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
          '-mt-2 h-12 w-full border-0 bg-transparent px-1 pb-2 focus-visible:border-0 focus-visible:ring-0',
          className,
        )}
      />
    </fieldset>
  );
};

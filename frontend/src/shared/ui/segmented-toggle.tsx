import { cn } from '@/shared/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

/**
 * 단일 선택 세그먼트 토글(필터 칩). 선택 항목은 primary 칩, 비선택은 외곽선 칩으로 표시한다.
 * 색만으로 상태를 전달하지 않도록 aria-pressed를 함께 제공한다.
 */
export const SegmentedToggle = <T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedToggleProps<T>) => (
  <div
    role="group"
    aria-label={label}
    className={cn('flex items-center gap-2', className)}
  >
    {options.map((option) => {
      const isActive = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          aria-pressed={isActive}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full px-4 py-2 typo-sm-sb transition-colors',
            isActive
              ? 'bg-primary text-primary-dark'
              : 'border border-grey-400 text-grey-100',
          )}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

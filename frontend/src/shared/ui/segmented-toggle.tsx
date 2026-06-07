import { useRef, type KeyboardEvent } from 'react';
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
 * 색만으로 상태를 전달하지 않도록 aria-pressed를 함께 제공하고,
 * roving tabindex + 좌우(상하) 화살표로 선택을 이동하는 키보드 내비게이션을 지원한다.
 */
export const SegmentedToggle = <T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedToggleProps<T>) => {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const moveSelection = (currentIndex: number, delta: number) => {
    if (options.length === 0) return;
    const nextIndex = (currentIndex + delta + options.length) % options.length;
    onChange(options[nextIndex].value);
    buttonRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelection(index, -1);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelection(index, 1);
    }
  };

  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex items-center gap-2', className)}
    >
      {options.map((option, index) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            aria-pressed={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
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
};

import { useRef, type KeyboardEvent } from 'react';
import { cn } from '@/shared/lib/utils';
import {
  slidingIndicatorClass,
  useSlidingIndicator,
} from '@/shared/lib/use-sliding-indicator';
import { GlassRim } from './glass-rim';
import { useFieldRequired } from './field-context';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** 선택됐을 때 기본 강조색(primary) 대신 쓸 채움 스타일. 밴드 공개 여부의 '비공개'처럼 중립 표현이 필요할 때. */
  selectedClassName?: string;
}

interface SegmentedToggleProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  className?: string;
  /**
   * 'filter'(기본): 각 칩이 외곽선/채움으로 표시되는 필터 칩.
   * 'tab': 하단강조 테두리 컨테이너 + 안쪽 칩(비선택은 테두리 없음). 일정 유형 등 탭 토글용.
   */
  variant?: 'filter' | 'tab';
}

/**
 * 단일 선택 세그먼트 토글. 색만으로 상태를 전달하지 않도록 aria-pressed를 함께 제공하고,
 * roving tabindex + 좌우(상하) 화살표로 선택을 이동하는 키보드 내비게이션을 지원한다.
 * variant='filter'는 필터 칩, variant='tab'은 디자인의 탭 토글(컨테이너 테두리) 형태다.
 */
export const SegmentedToggle = <T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  variant = 'filter',
}: SegmentedToggleProps<T>) => {
  const isTab = variant === 'tab';
  const fieldRequired = useFieldRequired();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { containerRef, indicatorRef } = useSlidingIndicator(value);
  const activeOption = options.find((option) => option.value === value);

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
      ref={containerRef}
      role="group"
      aria-label={label}
      aria-required={fieldRequired || undefined}
      className={cn(
        'flex items-center gap-2',
        isTab &&
          'relative w-fit rounded-full field-border border-white/24 bg-grey-500/24 p-2',
        className,
      )}
    >
      {isTab && (
        <>
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className={cn(
              slidingIndicatorClass,
              'rounded-full bg-primary',
              activeOption?.selectedClassName,
            )}
          />
          <GlassRim />
        </>
      )}
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
            data-active={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'rounded-full transition-colors',
              isTab
                ? cn(
                    'relative z-10 min-w-[77px] px-5 py-4 typo-sm-sb',
                    isActive ? 'text-gradient-top' : 'text-grey-100',
                  )
                : cn(
                    'px-4 py-2 typo-sm-sb',
                    isActive
                      ? cn(
                          'bg-primary text-primary-dark',
                          option.selectedClassName,
                        )
                      : 'border border-grey-400 text-grey-100',
                  ),
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

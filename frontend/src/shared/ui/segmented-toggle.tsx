import {
  useRef,
  type ComponentType,
  type KeyboardEvent,
  type SVGProps,
} from 'react';
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
  /**
   * 주면 글자 대신 아이콘만 그리는 작은 칩이 된다(보기 방식 전환처럼 자리가 좁을 때).
   * label은 화면에서 사라지고 버튼 이름(aria-label)으로 쓰인다.
   */
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
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
  // 아이콘 칩은 글자 칩보다 작아, 컨테이너 여백도 그에 맞춰 줄인다.
  const isIconOnly = options.every((option) => option.icon);
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
          'relative w-fit rounded-full field-border border-white/24 bg-grey-500/24',
        isTab && (isIconOnly ? 'gap-0 p-1.5' : 'p-2'),
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
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            aria-label={Icon ? option.label : undefined}
            aria-pressed={isActive}
            data-active={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              'rounded-full transition-colors',
              isTab
                ? cn(
                    'relative z-10 typo-sm-sb',
                    Icon
                      ? 'inline-flex size-8 items-center justify-center'
                      : 'min-w-[77px] px-5 py-4',
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
            {Icon ? (
              <Icon aria-hidden="true" className="size-4" />
            ) : (
              option.label
            )}
          </button>
        );
      })}
    </div>
  );
};

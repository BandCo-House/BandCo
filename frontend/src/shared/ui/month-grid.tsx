import type { ReactNode } from 'react';
import { WEEKDAY_LABELS, getMonthDays } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';

export interface MonthGridDay {
  isSelected: boolean;
  /** 오늘이면 선택되지 않았을 때 테두리로 표시한다. */
  isToday?: boolean;
  isDisabled?: boolean;
  /** 날짜 아래 줄에 그릴 표시(일정 수 점 등). showMarkers일 때만 쓰인다. */
  marker?: ReactNode;
  /** 버튼 이름 뒤에 덧붙일 말(예: '일정 3개'). 표시의 뜻을 스크린리더에 전한다. */
  labelSuffix?: string;
}

interface MonthGridProps {
  year: number;
  /** 0-based(Date#getMonth). */
  month: number;
  /** 날짜마다 상태를 정한다. 선택 방식(하나/여럿)과 제약은 사용처가 쥔다. */
  getDay: (date: Date) => MonthGridDay;
  onSelect: (date: Date) => void;
  /**
   * 날짜 아래에 표시 줄을 둔다. 켜면 표시가 없는 날도 같은 높이를 차지하고,
   * 줄 간격을 숫자–표시 간격보다 넓혀 표시가 제 날짜에 붙어 보이게 한다 —
   * 같으면 위 날짜 것인지 아래 날짜 것인지 헷갈린다.
   */
  showMarkers?: boolean;
  className?: string;
}

/**
 * 한 달의 요일 줄 + 날짜 격자. 월 캘린더들이 같이 쓰는 생김새(칸 크기·선택 원·오늘
 * 테두리·비활성 색)를 한 곳에 둔다. 값이 하나인지 여럿인지, 달을 누가 넘기는지는
 * 모르고, 날짜마다 getDay가 알려 준 상태대로만 그린다.
 */
export const MonthGrid = ({
  year,
  month,
  getDay,
  onSelect,
  showMarkers = false,
  className,
}: MonthGridProps) => (
  <div className={cn('flex flex-col', className)}>
    <div className="grid grid-cols-7">
      {WEEKDAY_LABELS.map((label) => (
        <span
          key={label}
          aria-hidden="true"
          className="py-3 text-center typo-sm-r text-grey-50"
        >
          {label}
        </span>
      ))}
    </div>

    <div
      className={cn(
        'grid grid-cols-7',
        showMarkers ? 'gap-x-1 gap-y-2' : 'gap-1',
      )}
    >
      {getMonthDays(year, month).map((date, index) => {
        if (!date) {
          return <span key={`blank-${index}`} aria-hidden="true" />;
        }
        const { isSelected, isToday, isDisabled, marker, labelSuffix } =
          getDay(date);

        return (
          // 클릭 범위는 표시 줄까지 포함한 셀 전체, 강조는 숫자 원만 받는다.
          <button
            key={date.getDate()}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAY_LABELS[date.getDay()]}요일${labelSuffix ? `, ${labelSuffix}` : ''}`}
            disabled={isDisabled}
            onClick={() => onSelect(date)}
            className={cn(
              'group flex flex-col items-center gap-0.5 outline-none',
              isDisabled && 'cursor-not-allowed',
            )}
          >
            <span
              className={cn(
                'flex aspect-square w-full max-w-11 items-center justify-center rounded-full transition-colors',
                'group-focus-visible:outline-2 group-focus-visible:outline-primary',
                // typo-* 는 tailwind-merge가 같은 그룹으로 못 묶어 둘 다 남는다. 하나만 조건부로 붙인다.
                isSelected
                  ? 'bg-primary typo-sm-sb text-primary-dark'
                  : 'typo-sm-r',
                !isSelected && (isDisabled ? 'text-grey-400' : 'text-grey-300'),
                !isSelected &&
                  !isDisabled &&
                  'group-hover:bg-overlay-24 group-active:bg-overlay-24',
                isToday && !isSelected && 'border border-primary-light',
              )}
            >
              {date.getDate()}
            </span>
            {showMarkers && (
              <span
                aria-hidden="true"
                className="flex h-1 items-center justify-center gap-1"
              >
                {marker}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

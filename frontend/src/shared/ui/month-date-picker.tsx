import AddMiniIcon from '@/assets/icons/add-mini.svg?react';
import {
  WEEKDAY_LABELS,
  formatLocalDate,
  getMonthDays,
  isSameDay,
} from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';

// 점은 최대 3개. 그보다 많으면 점 2개 뒤에 '+'를 붙여 "더 있음"을 알린다.
const MAX_MARKER_DOTS = 3;

interface MonthDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  /** 날짜 키('YYYY-MM-DD') → 그날의 항목 수. 날짜 아래에 점으로 표시한다. */
  markers?: ReadonlyMap<string, number>;
  /** 스크린리더가 점의 뜻을 읽을 때 쓰는 단위(예: '일정'). */
  markerLabel?: string;
  className?: string;
}

/**
 * 한 달을 그리드로 보여주고 하루를 고르는 날짜 선택기. WeekDateStrip의 월 단위 짝이다.
 * 여러 날짜를 고르는 MonthCalendar와 달리 값이 하나이고, 달 이동·제목은 사용처가 맡는다.
 */
export const MonthDatePicker = ({
  value,
  onChange,
  markers,
  markerLabel = '항목',
  className,
}: MonthDatePickerProps) => {
  const days = getMonthDays(value.getFullYear(), value.getMonth());

  return (
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

      {/* 점이 제 날짜에 붙어 보이도록 숫자–점 간격(2)보다 줄 간격(8)을 넓게 둔다.
          같으면 점이 위 날짜 것인지 아래 날짜 것인지 헷갈린다. */}
      <div className="grid grid-cols-7 gap-x-1 gap-y-2">
        {days.map((date, index) => {
          if (!date) {
            return <span key={`blank-${index}`} aria-hidden="true" />;
          }
          const isSelected = isSameDay(date, value);
          const count = markers?.get(formatLocalDate(date)) ?? 0;
          const hasMore = count > MAX_MARKER_DOTS;
          const dotCount = hasMore ? MAX_MARKER_DOTS - 1 : count;

          return (
            // 클릭 범위는 점 줄까지 포함한 셀 전체, 강조는 숫자 원만 받는다.
            <button
              key={date.getDate()}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAY_LABELS[date.getDay()]}요일${count > 0 ? `, ${markerLabel} ${count}개` : ''}`}
              onClick={() => onChange(date)}
              className="group flex flex-col items-center gap-0.5 outline-none"
            >
              <span
                className={cn(
                  'flex aspect-square w-full max-w-11 items-center justify-center rounded-full transition-colors',
                  // typo-* 는 tailwind-merge가 같은 그룹으로 못 묶어 둘 다 남는다. 하나만 조건부로 붙인다.
                  isSelected
                    ? 'bg-primary typo-sm-sb text-gradient-top'
                    : 'typo-sm-r text-grey-300 group-hover:bg-overlay-24 group-focus-visible:bg-overlay-24 group-active:bg-overlay-24',
                )}
              >
                {date.getDate()}
              </span>
              {/* 점이 없는 날도 같은 높이를 차지해 줄이 들쭉날쭉하지 않게 한다. */}
              <span
                aria-hidden="true"
                className="flex h-1 items-center justify-center gap-1"
              >
                {Array.from({ length: dotCount }, (_, dot) => (
                  <span key={dot} className="size-1 rounded-full bg-primary" />
                ))}
                {hasMore && <AddMiniIcon className="size-1 text-grey-50" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

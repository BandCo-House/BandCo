import { useState } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { WEEKDAY_LABELS, formatLocalDate, startOfDay } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';

interface MonthCalendarProps {
  /** 선택된 날짜('YYYY-MM-DD') 목록. */
  value: string[];
  onChange: (next: string[]) => void;
  /** 이 날짜(로컬 자정) 이전은 선택 불가. 기본은 제한 없음. */
  minDate?: Date;
  className?: string;
}

/** 해당 월의 날짜들을 주 단위 그리드(앞쪽 빈 칸 포함)로 만든다. */
const buildMonthDays = (year: number, month: number): (Date | null)[] => {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array.from(
    { length: first.getDay() },
    () => null,
  );
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(year, month, day));
  }
  return cells;
};

/**
 * 여러 날짜를 고르는 월 캘린더. 일정 투표에서 후보 날짜 선택에 쓴다.
 * 값은 'YYYY-MM-DD' 로컬 날짜 키 배열로 주고받는다.
 */
export const MonthCalendar = ({
  value,
  onChange,
  minDate,
  className,
}: MonthCalendarProps) => {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const todayKey = formatLocalDate(new Date());
  const minTime = minDate ? startOfDay(minDate).getTime() : null;
  const selected = new Set(value);

  const moveMonth = (offset: number) =>
    setViewMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    );

  const toggleDate = (dateKey: string) =>
    onChange(
      selected.has(dateKey)
        ? value.filter((key) => key !== dateKey)
        : [...value, dateKey].sort(),
    );

  const days = buildMonthDays(viewMonth.getFullYear(), viewMonth.getMonth());

  return (
    <div className={cn('flex w-full flex-col gap-3 p-3 pb-4', className)}>
      <div className="flex items-center justify-between">
        <p className="typo-base-sb text-grey-50">
          {viewMonth.getFullYear()}년 {viewMonth.getMonth() + 1}월
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => moveMonth(-1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
          </button>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => moveMonth(1)}
            className="inline-flex size-11 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ArrowRightIcon aria-hidden="true" className="size-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            className="p-3 text-center typo-sm-r text-grey-50"
            aria-hidden="true"
          >
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <span key={`blank-${index}`} aria-hidden="true" />;
          }
          const dateKey = formatLocalDate(date);
          const isSelected = selected.has(dateKey);
          const isToday = dateKey === todayKey;
          const isDisabled = minTime !== null && date.getTime() < minTime;

          return (
            <button
              key={dateKey}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAY_LABELS[date.getDay()]}요일`}
              disabled={isDisabled}
              onClick={() => toggleDate(dateKey)}
              className={cn(
                'mx-auto flex size-11 items-center justify-center rounded-full typo-sm-r text-grey-300',
                'focus-visible:outline-2 focus-visible:outline-primary',
                isToday && !isSelected && 'border border-primary-light',
                isSelected && 'bg-primary typo-sm-sb text-primary-dark',
                isDisabled && 'cursor-not-allowed text-grey-400',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

import { useState } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { formatLocalDate, startOfDay } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { MonthGrid } from './month-grid';

interface MonthCalendarProps {
  /** 선택된 날짜('YYYY-MM-DD') 목록. */
  value: string[];
  onChange: (next: string[]) => void;
  /** 이 날짜(로컬 자정) 이전은 선택 불가. 기본은 제한 없음. */
  minDate?: Date;
  className?: string;
}

/**
 * 여러 날짜를 고르는 월 캘린더. 일정 투표에서 후보 날짜 선택에 쓴다.
 * 값은 'YYYY-MM-DD' 로컬 날짜 키 배열로 주고받는다.
 * 격자의 생김새는 하루를 고르는 MonthDatePicker와 MonthGrid를 같이 쓴다.
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

      <MonthGrid
        year={viewMonth.getFullYear()}
        month={viewMonth.getMonth()}
        onSelect={(date) => toggleDate(formatLocalDate(date))}
        getDay={(date) => {
          const dateKey = formatLocalDate(date);
          return {
            isSelected: selected.has(dateKey),
            isToday: dateKey === todayKey,
            isDisabled: minTime !== null && date.getTime() < minTime,
          };
        }}
      />
    </div>
  );
};

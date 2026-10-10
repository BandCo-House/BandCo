import { useMemo } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import {
  WEEKDAY_LABELS,
  addDays,
  getWeekDays,
  isSameDay,
} from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';

// 디자인은 일요일 시작 주이므로 lib의 월요일 기준 대신 일요일 시작을 계산한다.
const getStartOfSundayWeek = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(date.getDate() - date.getDay());
  return start;
};

interface WeekDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

/**
 * 한 주(일~토)의 요일·날짜 줄. 선택된 날짜를 강조한다.
 * 제목과 주 이동이 따로 있는 화면(합주 메인의 월별/주별 전환)은 이것만 쓴다.
 */
export const WeekDateStrip = ({
  value,
  onChange,
  className,
}: WeekDatePickerProps) => {
  const weekDays = useMemo(
    () => getWeekDays(getStartOfSundayWeek(value)),
    [value],
  );
  const selectedWeekday = value.getDay();

  return (
    <div className={className}>
      <div className="flex">
        {WEEKDAY_LABELS.map((weekday, index) => (
          <span
            key={weekday}
            className={cn(
              'flex-1 text-center typo-xs-sb',
              index === selectedWeekday ? 'text-grey-50' : 'text-grey-300',
            )}
          >
            {weekday}
          </span>
        ))}
      </div>
      <div className="mt-2 flex">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, value);
          return (
            // 클릭 범위는 셀 전체로 넓히고(레이아웃 유지), 강조는 안쪽 원만 받는다.
            <button
              key={day.toISOString()}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일`}
              onClick={() => onChange(day)}
              className="group flex flex-1 justify-center py-1.5 outline-none"
            >
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-full typo-xs-sb transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-dark'
                    : 'text-grey-50 group-hover:bg-overlay-24 group-focus-visible:bg-overlay-24 group-active:bg-overlay-24',
                )}
              >
                {day.getDate()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 한 주(일~토)를 가로 스트립으로 보여주는 공통 날짜 선택기.
 * 좌우 화살표로 주를 이동하고, 선택된 날짜를 강조한다. 여러 페이지에서 재사용한다.
 */
export const WeekDatePicker = ({
  value,
  onChange,
  className,
}: WeekDatePickerProps) => {
  const monthLabel = `${value.getFullYear()}년 ${value.getMonth() + 1}월`;

  return (
    <section className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-center justify-between">
        <h2 className="typo-lg-sb text-grey-50">{monthLabel}</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="이전 주"
            onClick={() => onChange(addDays(value, -7))}
            className="inline-flex size-7 items-center justify-center rounded-full text-grey-300"
          >
            <ArrowRightIcon aria-hidden="true" className="size-4 rotate-180" />
          </button>
          <button
            type="button"
            aria-label="다음 주"
            onClick={() => onChange(addDays(value, 7))}
            className="inline-flex size-7 items-center justify-center rounded-full text-grey-300"
          >
            <ArrowRightIcon aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <WeekDateStrip value={value} onChange={onChange} />
    </section>
  );
};

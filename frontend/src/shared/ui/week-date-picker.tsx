import { useMemo } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import {
  WEEKDAY_LABELS,
  addDays,
  formatLocalDate,
  getStartOfSundayWeek,
  getWeekDays,
  isSameDay,
} from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { MarkerDots } from './marker-dots';

interface WeekDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  /**
   * 날짜 키('YYYY-MM-DD') → 그날의 항목 수. 주면 날짜 아래에 점을 찍는다.
   * 월 보기(MonthDatePicker)와 같은 점이라, 주 보기에서도 일정 있는 날을 눌러 보지 않고 안다.
   */
  markers?: ReadonlyMap<string, number>;
  /** 스크린리더가 점의 뜻을 읽을 때 쓰는 단위(예: '일정'). */
  markerLabel?: string;
  className?: string;
}

/**
 * 한 주(일~토)의 요일·날짜 줄. 선택된 날짜를 강조한다.
 * 제목과 주 이동이 따로 있는 화면(합주 메인의 월별/주별 전환)은 이것만 쓴다.
 */
export const WeekDateStrip = ({
  value,
  onChange,
  markers,
  markerLabel = '항목',
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
          const count = markers?.get(formatLocalDate(day)) ?? 0;
          return (
            // 클릭 범위는 셀 전체로 넓히고(레이아웃 유지), 강조는 안쪽 원만 받는다.
            <button
              key={day.toISOString()}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${day.getMonth() + 1}월 ${day.getDate()}일${count > 0 ? ` ${markerLabel} ${count}개` : ''}`}
              onClick={() => onChange(day)}
              className="group flex flex-1 flex-col items-center gap-1.5 py-1.5 outline-none"
            >
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-full typo-xs-sb transition-colors',
                  isSelected
                    ? 'bg-grey-50 text-gradient-top'
                    : 'text-grey-50 group-hover:bg-overlay-24 group-focus-visible:bg-overlay-24 group-active:bg-overlay-24',
                )}
              >
                {day.getDate()}
              </span>
              {markers && (
                // 점이 없는 날도 같은 높이를 차지해 숫자 줄이 날마다 들쭉날쭉하지 않게 한다.
                <span
                  aria-hidden="true"
                  className="flex h-1 items-center justify-center gap-1"
                >
                  {count > 0 && <MarkerDots count={count} />}
                </span>
              )}
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

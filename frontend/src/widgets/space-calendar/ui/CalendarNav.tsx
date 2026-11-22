import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { addDays, addMonths, getWeekOfMonth } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import {
  SegmentedToggle,
  type SegmentedOption,
} from '@/shared/ui/segmented-toggle';

export type CalendarView = 'month' | 'week';

// 아이콘(⊞/☰)만 있던 전환을 글자로 바꾼다. UT에서 월 보기를 원했는데, 이미 있는 월 보기를
// 아이콘만 보고는 찾지 못했다.
const VIEW_OPTIONS: SegmentedOption<CalendarView>[] = [
  { value: 'week', label: '주간' },
  { value: 'month', label: '월간' },
];

// 보기 단위에 따라 화살표가 옮기는 폭과 제목이 달라진다.
const VIEW_NAV: Record<
  CalendarView,
  {
    unit: string;
    move: (date: Date, direction: 1 | -1) => Date;
    title: (date: Date) => string;
  }
> = {
  month: {
    unit: '달',
    move: (date, direction) => addMonths(date, direction),
    title: (date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
  },
  week: {
    unit: '주',
    move: (date, direction) => addDays(date, direction * 7),
    // 올해면 연도를 뺀다. "주간/월간" 글자 토글과 화살표 두 개가 한 줄에 들어가면 연도까지
    // 붙은 제목(약 140px)이 375px 이하 화면에서 오른쪽 화살표와 겹쳤다. 합주 기간 칩과 같은 규칙이다.
    title: (date) =>
      `${date.getFullYear() === new Date().getFullYear() ? '' : `${date.getFullYear()}년 `}${date.getMonth() + 1}월 ${getWeekOfMonth(date)}주차`,
  },
};

const arrowButtonClass =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-key';

interface CalendarNavProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
}

/** 캘린더 상단 줄: 월별/주별 보기 전환 + 현재 기간 제목과 앞뒤 이동. */
export const CalendarNav = ({
  view,
  onViewChange,
  value,
  onChange,
  className,
}: CalendarNavProps) => {
  const nav = VIEW_NAV[view];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SegmentedToggle
        tone="view"
        variant="tab"
        size="sm"
        label="캘린더 보기 방식"
        className="shrink-0"
        options={VIEW_OPTIONS}
        value={view}
        onChange={onViewChange}
      />

      <div className="flex min-w-0 flex-1 items-center">
        <button
          type="button"
          aria-label={`이전 ${nav.unit}`}
          onClick={() => onChange(nav.move(value, -1))}
          className={arrowButtonClass}
        >
          <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
        </button>
        <h2
          aria-live="polite"
          className="min-w-0 flex-1 text-center typo-lg-sb whitespace-nowrap text-grey-50"
        >
          {nav.title(value)}
        </h2>
        <button
          type="button"
          aria-label={`다음 ${nav.unit}`}
          onClick={() => onChange(nav.move(value, 1))}
          className={arrowButtonClass}
        >
          <ArrowRightIcon aria-hidden="true" className="size-6" />
        </button>
      </div>
    </div>
  );
};

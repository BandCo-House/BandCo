import { useState } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { WEEKDAY_LABELS, isSameDay } from '@/shared/lib/date';
import { cn } from '@/shared/lib/utils';
import { useFieldRequired } from '@/shared/ui/field-context';
import { MonthCalendarShell } from '@/shared/ui/month-calendar';
import { toWheelDate, type WheelDate } from '@/shared/ui/wheel-date';
import { WheelFieldCard } from '@/shared/ui/wheel-field-card';
import { WheelTimePicker } from '@/shared/ui/wheel-time-picker';

/** 지금 고치고 있는 칸. 요약의 네 칩 중 하나이고, 아래 패널이 이 값에 따라 바뀐다. */
type ActiveSlot = 'startDate' | 'startTime' | 'endDate' | 'endTime';

const toDate = (d: WheelDate): Date => new Date(d.year, d.month - 1, d.day);

/** WheelDate → '9월 22일(목)' */
const formatDateChip = (d: WheelDate): string =>
  `${d.month}월 ${d.day}일(${WEEKDAY_LABELS[toDate(d).getDay()]})`;

/** 'HH:mm' → '오후 2:30' */
const formatTimeChip = (time: string): string => {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour >= 12 ? '오후' : '오전'} ${hour12}:${String(minute).padStart(2, '0')}`;
};

interface SlotChipProps {
  /** 스크린리더용 이름(예: '시작 날짜'). 화면에는 값만 보인다. */
  name: string;
  value: string;
  isActive: boolean;
  onClick: () => void;
}

const SlotChip = ({ name, value, isActive, onClick }: SlotChipProps) => (
  <button
    type="button"
    aria-label={`${name} ${value}`}
    aria-pressed={isActive}
    onClick={onClick}
    className={cn(
      'rounded-full px-3 py-1.5 typo-base-sb whitespace-nowrap text-grey-50 transition-colors',
      'focus-visible:outline-2 focus-visible:outline-primary',
      isActive && 'bg-surface-3',
    )}
  >
    {value}
  </button>
);

interface ScheduleTimeSheetProps {
  startDate: WheelDate;
  onStartDateChange: (date: WheelDate) => void;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  endDate: WheelDate;
  onEndDateChange: (date: WheelDate) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
  /** 종료가 시작보다 앞서 있는지. */
  invalid?: boolean;
  /** invalid일 때 오류 문구의 id. */
  errorId?: string;
}

/**
 * 일정의 시작·종료 일시. 위 줄에 네 값(시작 날짜·시각 → 종료 날짜·시각)을 요약해 두고,
 * 누른 칸 하나만 아래에서 고친다 — 날짜면 월 캘린더, 시각이면 시간 휠.
 *
 * 휠 네 벌을 한꺼번에 펼치면 어느 휠이 어느 값인지 읽히지 않았다. 전체는 요약 줄에서
 * 한눈에 보고, 조작은 한 번에 하나만 하게 한다. 날짜를 캘린더로 고르므로 연도를 따로
 * 묻거나 추론할 일도 없다.
 */
export const ScheduleTimeSheet = ({
  startDate,
  onStartDateChange,
  startTime,
  onStartTimeChange,
  endDate,
  onEndDateChange,
  endTime,
  onEndTimeChange,
  invalid = false,
  errorId,
}: ScheduleTimeSheetProps) => {
  const [active, setActive] = useState<ActiveSlot>('startDate');
  const fieldRequired = useFieldRequired();

  const start = toDate(startDate);
  const end = toDate(endDate);
  const today = new Date();
  const isPickingEnd = active === 'endDate';

  const chip = (slot: ActiveSlot, name: string, value: string) => (
    <SlotChip
      name={name}
      value={value}
      isActive={active === slot}
      onClick={() => setActive(slot)}
    />
  );

  return (
    <div
      role="group"
      aria-label="시작·종료 일시"
      aria-required={fieldRequired || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 py-1">
          {chip('startDate', '시작 날짜', formatDateChip(startDate))}
          {chip('startTime', '시작 시각', formatTimeChip(startTime))}
        </div>
        <ArrowRightIcon
          aria-hidden="true"
          className="size-6 shrink-0 text-grey-50"
        />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-2 py-1">
          {chip('endDate', '종료 날짜', formatDateChip(endDate))}
          {chip('endTime', '종료 시각', formatTimeChip(endTime))}
        </div>
      </div>

      {active === 'startDate' || active === 'endDate' ? (
        <MonthCalendarShell
          // 시작↔종료를 오갈 때 그쪽 날짜가 있는 달부터 다시 보여준다.
          key={active}
          className="px-3 py-0"
          defaultMonth={isPickingEnd ? end : start}
          onSelect={(date) =>
            (isPickingEnd ? onEndDateChange : onStartDateChange)(
              toWheelDate(date),
            )
          }
          getDay={(date) => ({
            // 시작~종료 사이를 모두 칠해 일정이 걸치는 기간을 보여준다.
            isSelected: date >= start && date <= end,
            isToday: isSameDay(date, today),
            // 종료를 고를 때 시작보다 앞선 날은 고를 수 없다.
            isDisabled: isPickingEnd && date < start,
          })}
        />
      ) : (
        <WheelFieldCard className="py-3">
          {/* relative z-10: 카드의 유리 림·글로우(absolute) 위로 올라와야 휠이 눌린다. */}
          <WheelTimePicker
            className="relative z-10"
            label={active === 'startTime' ? '시작 시각' : '종료 시각'}
            labelHidden
            value={active === 'startTime' ? startTime : endTime}
            onChange={
              active === 'startTime' ? onStartTimeChange : onEndTimeChange
            }
          />
        </WheelFieldCard>
      )}
    </div>
  );
};

import { useState } from 'react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { SlotChip } from '@/features/schedule-create/ui/components/ScheduleTimeSheet';
import { WEEKDAY_LABELS, isSameDay } from '@/shared/lib/date';
import { MonthCalendarShell } from '@/shared/ui/month-calendar';
import { toWheelDate, type WheelDate } from '@/shared/ui/wheel-date';

type ActiveSlot = 'start' | 'end';

const toDate = (d: WheelDate): Date => new Date(d.year, d.month - 1, d.day);

/** WheelDate → '11월 9일(월)'. 올해가 아니면 연도를 붙인다. */
const formatDateChip = (d: WheelDate): string => {
  const year = d.year === new Date().getFullYear() ? '' : `${d.year}년 `;
  return `${year}${d.month}월 ${d.day}일(${WEEKDAY_LABELS[toDate(d).getDay()]})`;
};

interface SpacePeriodPickerProps {
  id?: string;
  startDate: WheelDate;
  endDate: WheelDate;
  /** 끄면 종료 없이 시작만 고른다(상시 합주). */
  hasEnd: boolean;
  onChange: (period: { startDate: WheelDate; endDate: WheelDate }) => void;
  invalid?: boolean;
  errorId?: string;
}

/**
 * 합주 기간. 위 줄에 시작·종료를 요약하고, 아래 월 캘린더에서 고른다.
 * 일정 추가의 날짜 선택(ScheduleTimeSheet)과 같은 방식이다.
 *
 * 연·월·일 휠 두 벌로는 기간이 며칠인지, 언제부터 언제인지 그림으로 보이지 않았다
 * (UT: "달력에서 고르고 위에 바가 표시되면 편할 듯"). 시작을 고르면 바로 종료로 넘어가
 * 두 번 누르면 끝나고, 그 사이를 칠해 기간을 보여준다.
 */
export const SpacePeriodPicker = ({
  id,
  startDate,
  endDate,
  hasEnd,
  onChange,
  invalid = false,
  errorId,
}: SpacePeriodPickerProps) => {
  const [active, setActive] = useState<ActiveSlot>('start');
  const isPickingEnd = hasEnd && active === 'end';
  const start = toDate(startDate);
  const end = toDate(endDate);
  const today = new Date();

  const pick = (date: Date) => {
    const picked = toWheelDate(date);
    if (isPickingEnd) {
      onChange({ startDate, endDate: picked });
      return;
    }
    // 시작을 종료 뒤로 옮기면 종료도 같이 민다. 잘못된 기간이 화면에 남지 않게 한다.
    onChange({
      startDate: picked,
      endDate: date > end ? picked : endDate,
    });
    if (hasEnd) setActive('end');
  };

  return (
    <div
      id={id}
      tabIndex={-1}
      role="group"
      aria-label="합주 기간"
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      className="flex flex-col gap-4 outline-none"
    >
      <div className="flex items-center justify-center gap-2">
        <SlotChip
          name="시작 날짜"
          value={formatDateChip(startDate)}
          isActive={!isPickingEnd}
          onClick={() => setActive('start')}
        />
        <ArrowRightIcon
          aria-hidden="true"
          className="size-6 shrink-0 text-grey-50"
        />
        {hasEnd ? (
          <SlotChip
            name="종료 날짜"
            value={formatDateChip(endDate)}
            isActive={isPickingEnd}
            onClick={() => setActive('end')}
          />
        ) : (
          <span className="px-3 py-1.5 typo-base-sb text-grey-300">
            정해진 기간 없음
          </span>
        )}
      </div>

      <MonthCalendarShell
        // 시작↔종료를 오갈 때 그쪽 날짜가 있는 달부터 다시 보여준다.
        key={isPickingEnd ? 'end' : 'start'}
        className="px-3 py-0"
        defaultMonth={isPickingEnd ? end : start}
        onSelect={pick}
        getDay={(date) => ({
          // 시작~종료 사이를 모두 칠해 기간을 보여준다. 종료가 없으면 시작 하루만.
          isSelected: hasEnd
            ? date >= start && date <= end
            : isSameDay(date, start),
          isToday: isSameDay(date, today),
          // 종료를 고를 때 시작보다 앞선 날은 고를 수 없다.
          isDisabled: isPickingEnd && date < start,
        })}
      />
    </div>
  );
};

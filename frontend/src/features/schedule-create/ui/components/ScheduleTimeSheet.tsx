import type { WheelDate } from '@/shared/ui/wheel-date';
import { WheelDatePicker } from '@/shared/ui/wheel-date-picker';
import { WheelTimePicker } from '@/shared/ui/wheel-time-picker';
import { useFieldRequired } from '@/shared/ui/field-context';
import { WheelFieldCard } from '@/shared/ui/wheel-field-card';

interface ScheduleTimeSheetProps {
  /** '시작' | '종료'. 카드와 그 안 휠의 이름에 쓴다(화면 제목은 Field가 그린다). */
  label: string;
  date: WheelDate;
  onDateChange: (date: WheelDate) => void;
  time: string;
  onTimeChange: (time: string) => void;
  /** 연도를 휠로 고를지('wheel'), 추론된 값을 보여주기만 할지('readonly'). */
  yearMode: 'wheel' | 'readonly';
  /** 이 일시가 유효하지 않은지(종료가 시작보다 앞섬). 카드에 오류 상태를 알린다. */
  invalid?: boolean;
  /** invalid일 때 오류 문구의 id. */
  errorId?: string;
}

/**
 * 일정의 한쪽 끝(시작 또는 종료)을 고르는 카드: 날짜 휠 + 시간 휠.
 * 시작과 종료를 카드 두 장으로 나눈 이유 — 밤에 시작해 다음 날 새벽에 끝나는 일정이
 * 있어 양쪽 다 날짜가 필요한데, 휠 네 벌을 한 카드에 쌓으면 어느 휠이 어느 쪽 것인지
 * 읽히지 않는다.
 */
export const ScheduleTimeSheet = ({
  label,
  date,
  onDateChange,
  time,
  onTimeChange,
  yearMode,
  invalid = false,
  errorId,
}: ScheduleTimeSheetProps) => {
  const fieldRequired = useFieldRequired();

  return (
    <WheelFieldCard
      className="px-1 py-3"
      role="group"
      aria-label={`${label} 일시`}
      aria-required={fieldRequired || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
    >
      {/* relative z-10: 카드의 유리 림·글로우(absolute) 위로 올라와야 휠이 눌린다.
          한 줄에 안 들어가는 폭(대부분의 폰)에서는 시간 휠이 아래 줄로 내려간다. */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-3">
        <WheelDatePicker
          label={`${label} 날짜`}
          labelHidden
          yearMode={yearMode}
          dense
          value={date}
          onChange={onDateChange}
        />
        <WheelTimePicker
          label={`${label} 시각`}
          labelHidden
          dense
          value={time}
          onChange={onTimeChange}
        />
      </div>
    </WheelFieldCard>
  );
};

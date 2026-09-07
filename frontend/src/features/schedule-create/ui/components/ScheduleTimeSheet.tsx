import { pad2, type WheelDate } from '@/shared/ui/wheel-date';
import { WheelTimePicker } from '@/shared/ui/wheel-time-picker';
import { useFieldRequired } from '@/shared/ui/field-context';
import { GlassRim } from '@/shared/ui/glass-rim';
import { GlowBlob } from '@/shared/ui/glow-blob';

interface ScheduleTimeSheetProps {
  /** 스케줄 화면에서 보고 있던 날짜(읽기 전용). 휠로 바꾸지 않는다. */
  date: WheelDate;
  startTime: string;
  onStartTimeChange: (time: string) => void;
  endTime: string;
  onEndTimeChange: (time: string) => void;
}

/** WheelDate → 'YY - MM - DD'. */
const formatDate = (d: WheelDate) =>
  `${String(d.year).slice(2)} - ${pad2(d.month)} - ${pad2(d.day)}`;

/** 다음 날 날짜(종료가 자정을 넘길 때 종료 행 표기용). */
const addOneDay = (d: WheelDate): WheelDate => {
  const next = new Date(d.year, d.month - 1, d.day + 1);
  return {
    year: next.getFullYear(),
    month: next.getMonth() + 1,
    day: next.getDate(),
  };
};

const Row = ({
  date,
  time,
  onChange,
}: {
  date: WheelDate;
  time: string;
  onChange: (time: string) => void;
}) => (
  // 날짜+시간 휠이 한 줄에 안 들어가면 줄바꿈해 가운데 정렬로 재배치한다(좁은 화면 대응).
  // 줄바꿈됐을 때 날짜와 휠이 붙어 보이지 않도록 세로 간격(gap-y)을 넉넉히 둔다.
  <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-5">
    <span className="min-w-[92px] typo-base-sb text-grey-50">
      {formatDate(date)}
    </span>
    <WheelTimePicker value={time} onChange={onChange} />
  </div>
);

/**
 * 시작/종료 시간 시트. 날짜는 스케줄 화면에서 보던 날짜를 그대로 표시(읽기 전용)하고,
 * 시작·종료 시각만 휠로 고른다. 종료가 시작보다 이르면 종료 행은 다음 날로 표기된다.
 */
export const ScheduleTimeSheet = ({
  date,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
}: ScheduleTimeSheetProps) => {
  const endDate = endTime <= startTime ? addOneDay(date) : date;
  const fieldRequired = useFieldRequired();

  return (
    <div
      role="group"
      aria-label="시작·종료 시간"
      aria-required={fieldRequired || undefined}
      className="relative flex flex-col gap-6 overflow-hidden rounded-md field-border border-surface-1 bg-white/24 px-5 py-8 shadow-[0px_3px_6px_2px_rgba(255,255,255,0.16)] backdrop-blur-md"
    >
      <GlassRim />
      <GlowBlob />
      <Row date={date} time={startTime} onChange={onStartTimeChange} />
      <Row date={endDate} time={endTime} onChange={onEndTimeChange} />
    </div>
  );
};

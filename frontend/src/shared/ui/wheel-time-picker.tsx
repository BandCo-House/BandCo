import { cn } from '@/shared/lib/utils';
import { pad2 } from './wheel-date';
import { WheelColumn } from './wheel-column';

/** 시간 문자열 'HH:mm'(24h)을 오전/오후·12시간·분으로 분해한다. */
interface TimeParts {
  isPm: boolean;
  hour12: number; // 1~12
  minute: number; // 0,15,30,45
}

const MINUTE_STEP = 15;
const MINUTES = Array.from(
  { length: 60 / MINUTE_STEP },
  (_, i) => i * MINUTE_STEP,
);
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1~12
const MERIDIEM = [0, 1]; // 0=오전, 1=오후

const parseTime = (value: string): TimeParts => {
  const [rawHour = 0, rawMinute = 0] = value.split(':').map(Number);
  const isPm = rawHour >= 12;
  const hour12 = rawHour % 12 === 0 ? 12 : rawHour % 12;
  // 15분 단위 휠에 맞춰 가장 가까운 스텝으로 내림 정규화.
  const minute = Math.min(
    45,
    Math.floor(rawMinute / MINUTE_STEP) * MINUTE_STEP,
  );
  return { isPm, hour12, minute };
};

const toTimeString = ({ isPm, hour12, minute }: TimeParts): string => {
  const base = hour12 % 12; // 12 → 0
  const hour24 = isPm ? base + 12 : base;
  return `${pad2(hour24)}:${pad2(minute)}`;
};

interface WheelTimePickerProps {
  /** 'HH:mm' (24시간) */
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** 오전/오후 + 시(1~12) + 분(15분 단위)을 모두 휠(스크롤)로 고르는 시간 피커. */
export const WheelTimePicker = ({
  value,
  onChange,
  className,
}: WheelTimePickerProps) => {
  const parts = parseTime(value);

  const commit = (next: Partial<TimeParts>) =>
    onChange(toTimeString({ ...parts, ...next }));

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      // 가운데 선택 줄 강조 마스크(위아래 페이드).
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
      }}
    >
      <WheelColumn
        label="오전 오후"
        items={MERIDIEM}
        value={parts.isPm ? 1 : 0}
        onChange={(v) => commit({ isPm: v === 1 })}
        format={(v) => (v === 1 ? '오후' : '오전')}
      />
      <WheelColumn
        label="시"
        items={HOURS_12}
        value={parts.hour12}
        onChange={(hour12) => commit({ hour12 })}
        format={pad2}
      />
      <span className="px-1 typo-base-sb text-grey-50">:</span>
      <WheelColumn
        label="분"
        items={MINUTES}
        value={parts.minute}
        onChange={(minute) => commit({ minute })}
        format={pad2}
      />
    </div>
  );
};

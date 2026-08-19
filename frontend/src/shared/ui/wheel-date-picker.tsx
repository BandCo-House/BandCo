import { cn } from '@/shared/lib/utils';
import { pad2, type WheelDate } from './wheel-date';
import { WheelColumn } from './wheel-column';

export type { WheelDate } from './wheel-date';

const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

/** 해당 연·월의 마지막 날(28~31). month는 1-based. */
const lastDayOf = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

interface WheelDatePickerProps {
  value: WheelDate;
  onChange: (value: WheelDate) => void;
  /** 선택 가능한 연도 범위. 기본: 올해-10 ~ 올해+10. */
  minYear?: number;
  maxYear?: number;
  className?: string;
}

/**
 * 연·월·일을 휠(스크롤 스냅)로 고르는 날짜 피커.
 * 월/연이 바뀌어 말일을 넘기면 day를 자동으로 줄인다.
 */
export const WheelDatePicker = ({
  value,
  onChange,
  minYear,
  maxYear,
  className,
}: WheelDatePickerProps) => {
  const thisYear = new Date().getFullYear();
  const years = range(minYear ?? thisYear - 10, maxYear ?? thisYear + 10);
  const months = range(1, 12);
  const days = range(1, lastDayOf(value.year, value.month));

  // 연/월 변경 시 day가 말일을 넘지 않도록 보정한다.
  const commit = (next: WheelDate) => {
    const maxDay = lastDayOf(next.year, next.month);
    onChange({ ...next, day: Math.min(next.day, maxDay) });
  };

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      // 가운데 선택 줄을 은은하게 강조하는 마스크(위아래 페이드).
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent, #000 30%, #000 70%, transparent)',
      }}
    >
      <WheelColumn
        label="년"
        items={years}
        value={value.year}
        onChange={(year) => commit({ ...value, year })}
      />
      <WheelColumn
        label="월"
        items={months}
        value={value.month}
        onChange={(month) => commit({ ...value, month })}
        format={pad2}
      />
      <span className="px-1 typo-base-sb text-grey-100">월</span>
      <WheelColumn
        label="일"
        items={days}
        value={value.day}
        onChange={(day) => commit({ ...value, day })}
        format={pad2}
      />
      <span className="px-1 typo-base-sb text-grey-100">일</span>
    </div>
  );
};

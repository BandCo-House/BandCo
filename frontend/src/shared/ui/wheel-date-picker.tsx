import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { pad2, type WheelDate } from './wheel-date';

export type { WheelDate } from './wheel-date';

const ITEM_HEIGHT = 36;
// 가운데를 선택값으로 두고 위아래 1칸씩 노출한다(총 3칸).
const VISIBLE_COUNT = 3;
const PADDING = ((VISIBLE_COUNT - 1) / 2) * ITEM_HEIGHT;

const range = (start: number, end: number): number[] =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

/** 해당 연·월의 마지막 날(28~31). month는 1-based. */
const lastDayOf = (year: number, month: number) =>
  new Date(year, month, 0).getDate();

interface WheelColumnProps {
  items: number[];
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  label: string;
}

/** 세로 스크롤 스냅으로 한 자리(연/월/일)를 고르는 휠 컬럼. */
const WheelColumn = ({
  items,
  value,
  onChange,
  format,
  label,
}: WheelColumnProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);

  // 외부 값이 바뀌면(스냅 위치와 다를 때만) 해당 항목이 가운데 오도록 맞춘다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const index = Math.max(0, items.indexOf(value));
    const target = index * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target;
  }, [value, items]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const index = Math.min(
        items.length - 1,
        Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)),
      );
      const next = items[index];
      // 같은 값이면 호출하지 않아 외부 sync effect와의 루프를 막는다.
      if (next !== value) onChange(next);
    }, 90);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      role="listbox"
      aria-label={label}
      className="snap-y snap-mandatory overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ height: VISIBLE_COUNT * ITEM_HEIGHT }}
    >
      <div style={{ height: PADDING }} aria-hidden="true" />
      {items.map((item) => {
        const selected = item === value;
        return (
          <button
            key={item}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onChange(item)}
            className={cn(
              'flex w-full snap-center items-center justify-center typo-base-sb transition-colors',
              selected ? 'text-grey-50' : 'text-grey-300',
            )}
            style={{ height: ITEM_HEIGHT }}
          >
            {format ? format(item) : item}
          </button>
        );
      })}
      <div style={{ height: PADDING }} aria-hidden="true" />
    </div>
  );
};

interface WheelDatePickerProps {
  value: WheelDate;
  onChange: (value: WheelDate) => void;
  /** 선택 가능한 연도 범위. 기본: 올해 ~ 올해+5. */
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
  const years = range(minYear ?? thisYear, maxYear ?? thisYear + 5);
  const months = range(1, 12);
  const days = range(1, lastDayOf(value.year, value.month));

  // 연/월 변경 시 day가 말일을 넘지 않도록 보정한다.
  const commit = (next: WheelDate) => {
    const maxDay = lastDayOf(next.year, next.month);
    onChange({ ...next, day: Math.min(next.day, maxDay) });
  };

  return (
    <div
      className={cn('flex items-center justify-center gap-1', className)}
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

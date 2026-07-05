import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';
import { pad2, type WheelDate } from './wheel-date';

export type { WheelDate } from './wheel-date';

const ITEM_HEIGHT = 32;
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
  // 마우스 드래그 상태(네이티브 스크롤은 드래그로 안 움직여서 직접 처리한다).
  const drag = useRef<{
    startY: number;
    startTop: number;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  // 외부 값이 바뀌면(스냅 위치와 다를 때만) 해당 항목이 가운데 오도록 맞춘다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const index = Math.max(0, items.indexOf(value));
    const target = index * ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target;
  }, [value, items]);

  // 현재 스크롤 위치에서 가장 가까운 항목으로 스냅하고 값 반영.
  const settleToNearest = () => {
    const el = ref.current;
    if (!el) return;
    const index = Math.min(
      items.length - 1,
      Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)),
    );
    const next = items[index];
    if (next !== value) onChange(next);
  };

  // 터치·트랙패드·휠 네이티브 스크롤: 멈춘 뒤 스냅 값 확정(드래그 중엔 pointerup이 처리).
  const handleScroll = () => {
    if (drag.current) return;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(settleToNearest, 90);
  };

  // 마우스 드래그로 잡아끌기(터치/펜은 네이티브 스크롤에 맡긴다).
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || event.pointerType !== 'mouse') return;
    drag.current = {
      startY: event.clientY,
      startTop: el.scrollTop,
      moved: false,
    };
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !drag.current) return;
    const dy = event.clientY - drag.current.startY;
    if (Math.abs(dy) > 3) drag.current.moved = true;
    el.scrollTop = drag.current.startTop - dy;
  };
  const handlePointerEnd = () => {
    if (!drag.current) return;
    const moved = drag.current.moved;
    drag.current = null;
    if (moved) {
      // 드래그 직후 발생하는 클릭 선택을 무시하고, 가까운 항목으로 부드럽게 스냅.
      suppressClick.current = true;
      const el = ref.current;
      if (el) {
        const index = Math.min(
          items.length - 1,
          Math.max(0, Math.round(el.scrollTop / ITEM_HEIGHT)),
        );
        el.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
        if (items[index] !== value) onChange(items[index]);
      }
    }
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      role="listbox"
      aria-label={label}
      className="w-14 cursor-grab snap-y snap-mandatory overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
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
            onClick={() => {
              // 드래그 종료 직후의 클릭은 무시(선택은 스냅이 처리).
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              onChange(item);
            }}
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

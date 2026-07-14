import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';

export const WHEEL_ITEM_HEIGHT = 32;
// 가운데를 선택값으로 두고 위아래 1칸씩 노출한다(총 3칸).
export const WHEEL_VISIBLE_COUNT = 3;
const PADDING = ((WHEEL_VISIBLE_COUNT - 1) / 2) * WHEEL_ITEM_HEIGHT;

interface WheelColumnProps {
  items: number[];
  value: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  label: string;
  className?: string;
}

/** 세로 스크롤 스냅으로 한 자리(연/월/일 또는 시/분)를 고르는 휠 컬럼. */
export const WheelColumn = ({
  items,
  value,
  onChange,
  format,
  label,
  className,
}: WheelColumnProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | undefined>(undefined);

  // 외부 값이 바뀌면(스냅 위치와 다를 때만) 해당 항목이 가운데 오도록 맞춘다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const index = Math.max(0, items.indexOf(value));
    const target = index * WHEEL_ITEM_HEIGHT;
    if (Math.abs(el.scrollTop - target) > 1) el.scrollTop = target;
  }, [value, items]);

  // 스크롤(터치·트랙패드·휠)이 멈추면 가장 가까운 항목으로 스냅 값 확정.
  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const index = Math.min(
        items.length - 1,
        Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT)),
      );
      const next = items[index];
      if (next !== value) onChange(next);
    }, 90);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      role="listbox"
      aria-label={label}
      // overscroll-contain: 모달(Radix Dialog)의 스크롤 잠금과 충돌하지 않게 스크롤을 이 안에 가둔다.
      className={cn(
        'w-14 snap-y snap-mandatory overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      style={{ height: WHEEL_VISIBLE_COUNT * WHEEL_ITEM_HEIGHT }}
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
            style={{ height: WHEEL_ITEM_HEIGHT }}
          >
            {format ? format(item) : item}
          </button>
        );
      })}
      <div style={{ height: PADDING }} aria-hidden="true" />
    </div>
  );
};

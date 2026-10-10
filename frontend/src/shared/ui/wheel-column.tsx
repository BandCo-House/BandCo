import { useEffect, useRef } from 'react';
import { cn } from '@/shared/lib/utils';

export const WHEEL_ITEM_HEIGHT = 32;
// 가운데를 선택값으로 두고 위아래 1칸씩 노출한다(총 3칸).
export const WHEEL_VISIBLE_COUNT = 3;
// 두 자리 값(월·일·시·분) 컬럼을 좁힐 때 쓰는 폭. 기본(w-14)은 연도 네 자리에 맞춘 값이다.
export const WHEEL_COLUMN_DENSE_CLASS = 'w-11';
/**
 * 컬럼 사이 구분 글자(월·일·:)의 스타일. dense에서는 폭을 고정한다 — 날짜 줄과 시간 줄이
 * 위아래로 쌓였을 때 [연도|오전오후] [월|시] [일|분] 컬럼이 같은 x에 서려면, 글자 폭이
 * 제각각인 구분자까지 같은 폭이어야 한다.
 */
export const wheelSeparatorClass = (dense: boolean): string =>
  dense ? 'w-6 text-center typo-base-sb' : 'px-1 typo-base-sb';
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
      // listbox roving-focus를 구현하지 않으므로 역할을 과장하지 않는다. 항목은 각자 포커스 가능한
      // 토글 버튼(aria-pressed)이라 group으로 묶어 선택 상태만 정직하게 노출한다.
      role="group"
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
            aria-pressed={selected}
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

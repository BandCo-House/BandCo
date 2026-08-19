import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/**
 * 탭·세그먼트의 활성 항목 뒤로 미끄러지는 인디케이터.
 *
 * 사용법: 컨테이너에 `containerRef`와 `relative`를, 활성 항목에 `data-active="true"`를,
 * 인디케이터 엘리먼트에 `indicatorRef`와 `slidingIndicatorClass`를 건다.
 *
 * 위치는 state가 아니라 DOM 스타일로 직접 반영한다. 측정값을 state로 올리면
 * 렌더 → 측정 → 재렌더가 매번 연쇄로 일어나기 때문이다(외부 시스템 동기화에 해당).
 */
export const useSlidingIndicator = (
  activeKey: string,
  /** 'box'는 항목 전체를 덮고, 'underline'은 가로 위치·폭만 따라간다(높이는 CSS). */
  mode: 'box' | 'underline' = 'box',
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const active = container.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) {
      indicator.style.opacity = '0';
      return;
    }

    // 첫 배치는 애니메이션 없이 제자리에서 시작한다(0,0에서 미끄러져 오지 않도록).
    if (!indicator.dataset.placed) {
      indicator.dataset.placed = 'true';
      indicator.style.transition = 'none';
      requestAnimationFrame(() => {
        indicator.style.transition = '';
      });
    }

    indicator.style.opacity = '1';
    indicator.style.width = `${active.offsetWidth}px`;
    if (mode === 'underline') {
      indicator.style.transform = `translateX(${active.offsetLeft}px)`;
      return;
    }
    indicator.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    indicator.style.height = `${active.offsetHeight}px`;
  }, [mode]);

  useLayoutEffect(() => {
    measure();
  }, [measure, activeKey]);

  // 폰트 로딩·라벨 변경으로 항목 폭이 바뀌면 인디케이터도 따라가야 한다.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  return { containerRef, indicatorRef };
};

/** 인디케이터 공통 스타일. 위치·크기는 훅이 인라인으로 채운다. */
export const slidingIndicatorClass =
  'pointer-events-none absolute top-0 left-0 opacity-0 transition-[transform,width,height,background-color] duration-300 ease-out';

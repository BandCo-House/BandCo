import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

type FadeDirection = 'right' | 'bottom';

const fadeMask = (
  direction: FadeDirection,
  fadeStart: boolean,
  fadeEnd: boolean,
  size: string,
): CSSProperties => {
  const start = fadeStart ? 'transparent' : 'black';
  const end = fadeEnd ? 'transparent' : 'black';
  const value = `linear-gradient(to ${direction}, ${start}, black ${size}, black calc(100% - ${size}), ${end})`;
  return { maskImage: value, WebkitMaskImage: value };
};

/**
 * 가로 스크롤 영역의 양 끝을 페이드 아웃하는 `mask-image` 스타일을 만든다.
 *
 * 색 오버레이로 끝을 덮는 대신 콘텐츠 자체를 가장자리에서 투명화하므로,
 * 반투명·그라데이션 등 어떤 배경 위에서도 자연스럽게 녹아든다(하드코딩 색 불필요).
 *
 * @param fadeStart 시작(좌측)을 페이드할지 — 보통 "왼쪽으로 더 스크롤 가능"일 때 true
 * @param fadeEnd   끝(우측)을 페이드할지 — 보통 "오른쪽으로 더 스크롤 가능"일 때 true
 */
export const horizontalFadeMask = (
  fadeStart: boolean,
  fadeEnd: boolean,
  size = '2.5rem',
): CSSProperties => fadeMask('right', fadeStart, fadeEnd, size);

/** `horizontalFadeMask`의 세로 버전. 위(시작)·아래(끝)를 페이드한다. */
export const verticalFadeMask = (
  fadeStart: boolean,
  fadeEnd: boolean,
  size = '2.5rem',
): CSSProperties => fadeMask('bottom', fadeStart, fadeEnd, size);

interface ScrollEdges {
  atStart: boolean;
  atEnd: boolean;
}

type ScrollAxis = 'x' | 'y';

const readEdges = (el: HTMLElement, axis: ScrollAxis): ScrollEdges => {
  const position = axis === 'x' ? el.scrollLeft : el.scrollTop;
  const max =
    axis === 'x'
      ? el.scrollWidth - el.clientWidth
      : el.scrollHeight - el.clientHeight;
  return { atStart: position <= 1, atEnd: position >= max - 1 };
};

/**
 * 네이티브 스크롤 컨테이너의 양 끝 도달 여부를 추적한다.
 * scroll·resize에 더해 내용 변화(자식 추가·삭제)에도 반응한다 — 컨테이너 크기는
 * 그대로인데 내용만 길어지는 경우(목록에 항목 추가)는 ResizeObserver가 못 잡는다.
 */
const useScrollEdges = <T extends HTMLElement>(axis: ScrollAxis) => {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState<ScrollEdges>({
    atStart: true,
    atEnd: true,
  });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = readEdges(el, axis);
    setEdges((prev) =>
      prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
    );
  }, [axis]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(el);
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener('scroll', update);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [update]);

  return { ref, atStart: edges.atStart, atEnd: edges.atEnd };
};

/** 가로 스크롤 컨테이너용. `horizontalFadeMask`와 함께 쓰면 끝 페이드를 동적으로 켠다. */
export const useHorizontalScrollEdges = <T extends HTMLElement>() =>
  useScrollEdges<T>('x');

/** 세로 스크롤 컨테이너용. `verticalFadeMask`와 함께 쓴다. */
export const useVerticalScrollEdges = <T extends HTMLElement>() =>
  useScrollEdges<T>('y');

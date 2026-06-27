import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

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
): CSSProperties => {
  const start = fadeStart ? 'transparent' : 'black';
  const end = fadeEnd ? 'transparent' : 'black';
  const value = `linear-gradient(to right, ${start}, black ${size}, black calc(100% - ${size}), ${end})`;
  return { maskImage: value, WebkitMaskImage: value };
};

interface ScrollEdges {
  atStart: boolean;
  atEnd: boolean;
}

/**
 * 네이티브 가로 스크롤 컨테이너의 양 끝 도달 여부를 추적한다.
 * scroll/resize에 반응하며, `horizontalFadeMask`와 함께 쓰면 끝 페이드를 동적으로 켠다.
 */
export const useHorizontalScrollEdges = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState<ScrollEdges>({
    atStart: true,
    atEnd: true,
  });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({
      atStart: el.scrollLeft <= 1,
      atEnd: el.scrollLeft >= max - 1,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [update]);

  return { ref, atStart: edges.atStart, atEnd: edges.atEnd };
};

import { useEffect, useRef, useState } from 'react';

/**
 * 아래로 스크롤하는 동안 false, 위로 스크롤하거나 최상단이면 true.
 * 스크롤 방향에 따라 탭바 같은 보조 헤더를 접었다 펴는 데 쓴다.
 *
 * @param threshold 방향 전환으로 인정할 최소 이동량(px). 손떨림으로 깜빡이지 않게 한다.
 */
export const useShowOnScrollUp = (threshold = 8): boolean => {
  const [show, setShow] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    const handleScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < threshold) return;
      lastY.current = y;
      setShow(delta < 0 || y <= 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return show;
};

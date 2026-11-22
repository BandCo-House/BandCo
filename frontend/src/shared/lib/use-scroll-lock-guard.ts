import { useEffect } from 'react';

/**
 * 모달이 스크롤을 잠근 동안(body[data-scroll-locked]) 페이지가 움직이면 잠긴 위치로 되돌린다.
 *
 * html이 스크롤을 직접 맡아(index.css) 모달이 열려도 스크롤바 자리가 남는 대신, Radix의 잠금은
 * 휠·터치만 막는다. 모달 안에서 PageDown·End·Space를 누르면 뒤 화면이 끝까지 내려가고,
 * 스크롤바를 끌어도 움직인다. 그 스크롤을 여기서 되돌린다.
 */
export const useScrollLockGuard = () => {
  useEffect(() => {
    let lockedY: number | null = null;

    const restore = () => {
      if (lockedY !== null && window.scrollY !== lockedY) {
        window.scrollTo(0, lockedY);
      }
    };

    const removeListeners = () => {
      window.removeEventListener('scroll', restore);
      window.removeEventListener('scrollend', restore);
      window.removeEventListener('pointerup', restore);
    };

    const sync = () => {
      const locked = document.body.hasAttribute('data-scroll-locked');
      if (locked && lockedY === null) {
        lockedY = window.scrollY;
        // 스크롤바를 끄는 동안 Chrome이 scrollTo를 무시할 수 있어, 끝나는 시점(scrollend, 포인터를 뗄 때)에도
        // 한 번 더 되돌린다.
        window.addEventListener('scroll', restore, { passive: true });
        window.addEventListener('scrollend', restore);
        window.addEventListener('pointerup', restore);
      } else if (!locked && lockedY !== null) {
        lockedY = null;
        removeListeners();
      }
    };

    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-scroll-locked'],
    });
    sync();

    return () => {
      observer.disconnect();
      removeListeners();
    };
  }, []);
};

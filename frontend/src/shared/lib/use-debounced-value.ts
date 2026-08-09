import { useEffect, useState } from 'react';

/**
 * 값이 멈춘 뒤에야 반영되는 지연 값. 검색어처럼 타이핑마다 요청이 나가면 안 되는 입력에 쓴다.
 */
export const useDebouncedValue = <T>(value: T, delayMs = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timerId);
  }, [value, delayMs]);

  return debounced;
};

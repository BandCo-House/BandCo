import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScrollLockGuard } from './use-scroll-lock-guard';

const Guard = () => {
  useScrollLockGuard();
  return null;
};

const setScrollY = (y: number) =>
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });

describe('useScrollLockGuard', () => {
  afterEach(() => {
    document.body.removeAttribute('data-scroll-locked');
    setScrollY(0);
    vi.restoreAllMocks();
  });

  it('잠긴 동안 스크롤바를 끌어 움직이면 잠긴 위치로 되돌린다', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<Guard />);

    setScrollY(120);
    document.body.setAttribute('data-scroll-locked', '1');
    await Promise.resolve(); // MutationObserver 콜백을 기다린다

    setScrollY(420);
    window.dispatchEvent(new Event('scroll'));

    expect(scrollTo).toHaveBeenCalledWith(0, 120);
  });

  it('잠금이 풀리면 스크롤을 되돌리지 않는다', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<Guard />);

    document.body.setAttribute('data-scroll-locked', '1');
    await Promise.resolve();
    document.body.removeAttribute('data-scroll-locked');
    await Promise.resolve();

    setScrollY(300);
    window.dispatchEvent(new Event('scroll'));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

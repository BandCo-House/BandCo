import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIsSchedulePollClosed } from './use-is-closed';

describe('useIsSchedulePollClosed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('마감 시각이 지나면 화면을 열어둔 채로도 마감으로 바뀐다', () => {
    const closesAt = new Date(Date.now() + 5_000).toISOString();
    const { result } = renderHook(() => useIsSchedulePollClosed(closesAt));

    expect(result.current).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(result.current).toBe(true);
  });

  it('이미 지난 마감은 처음부터 마감이다', () => {
    const closesAt = new Date(Date.now() - 1_000).toISOString();
    const { result } = renderHook(() => useIsSchedulePollClosed(closesAt));

    expect(result.current).toBe(true);
  });

  it('마감 정보가 없으면 마감이 아니다', () => {
    const { result } = renderHook(() => useIsSchedulePollClosed(undefined));

    expect(result.current).toBe(false);
  });

  it('setTimeout 상한을 넘는 먼 마감은 타이머를 걸지 않는다', () => {
    const farFuture = new Date(Date.now() + 2 ** 31 + 10_000).toISOString();
    const spy = vi.spyOn(globalThis, 'setTimeout');

    renderHook(() => useIsSchedulePollClosed(farFuture));

    expect(spy).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, vi } from 'vitest';

import { createRefreshDeduper } from './refresh';

describe('createRefreshDeduper', () => {
  it('동시에 호출하면 재발급 함수는 한 번만 실행되고 같은 토큰을 받는다', async () => {
    const refresh = vi.fn(() => Promise.resolve('new-token'));
    const refreshOnce = createRefreshDeduper(refresh);

    const results = await Promise.all([
      refreshOnce(),
      refreshOnce(),
      refreshOnce(),
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['new-token', 'new-token', 'new-token']);
  });

  it('이전 재발급이 끝난 뒤 호출하면 새로 재발급한다', async () => {
    const refresh = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second');
    const refreshOnce = createRefreshDeduper(refresh);

    await expect(refreshOnce()).resolves.toBe('first');
    await expect(refreshOnce()).resolves.toBe('second');
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('재발급이 실패하면 기다리던 모든 호출이 실패하고, 다음 호출은 다시 시도한다', async () => {
    const refresh = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('만료'))
      .mockResolvedValueOnce('retry-token');
    const refreshOnce = createRefreshDeduper(refresh);

    const results = await Promise.allSettled([refreshOnce(), refreshOnce()]);

    expect(results.map((result) => result.status)).toEqual([
      'rejected',
      'rejected',
    ]);
    await expect(refreshOnce()).resolves.toBe('retry-token');
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});

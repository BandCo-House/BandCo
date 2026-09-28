import { afterEach, describe, expect, it, vi } from 'vitest';
import { serverNow, syncServerTime } from './server-time';

describe('serverNow / syncServerTime', () => {
  afterEach(() => {
    // 모듈 보정값을 원래대로 돌린다(다른 테스트에 새지 않게).
    syncServerTime(new Date().toUTCString());
    vi.useRealTimers();
  });

  it('Date 헤더가 클라이언트보다 앞서면 그만큼 앞당겨 준다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-27T09:00:00.000Z'));

    syncServerTime(new Date('2026-09-27T09:05:00.000Z').toUTCString());

    // Date 헤더는 초 단위라 ms 오차를 허용한다.
    expect(serverNow() - Date.now()).toBeGreaterThanOrEqual(
      5 * 60 * 1000 - 1000,
    );
  });

  it('헤더가 문자열이 아니거나 파싱되지 않으면 보정하지 않는다', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-27T09:00:00.000Z'));
    syncServerTime(new Date('2026-09-27T09:00:00.000Z').toUTCString());

    syncServerTime(undefined);
    syncServerTime('not-a-date');

    expect(Math.abs(serverNow() - Date.now())).toBeLessThan(1000);
  });
});

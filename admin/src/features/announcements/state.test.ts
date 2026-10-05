import { describe, expect, it } from 'vitest';

import { getAnnouncementState } from './state';

const NOW = new Date('2026-10-05T00:00:00.000Z');
const PAST = '2026-10-01T00:00:00.000Z';
const FUTURE = '2026-10-10T00:00:00.000Z';

describe('getAnnouncementState', () => {
  it('게시하지 않은 공지는 기간과 상관없이 비공개다', () => {
    expect(
      getAnnouncementState(
        { isPublished: false, startsAt: PAST, endsAt: FUTURE },
        NOW,
      ),
    ).toBe('PRIVATE');
  });

  it('기간이 없으면 게시 중이다', () => {
    expect(
      getAnnouncementState(
        { isPublished: true, startsAt: null, endsAt: null },
        NOW,
      ),
    ).toBe('ACTIVE');
  });

  it('시작 시각이 미래면 예약이다', () => {
    expect(
      getAnnouncementState(
        { isPublished: true, startsAt: FUTURE, endsAt: null },
        NOW,
      ),
    ).toBe('SCHEDULED');
  });

  it('종료 시각이 지났으면 종료다', () => {
    expect(
      getAnnouncementState(
        { isPublished: true, startsAt: null, endsAt: PAST },
        NOW,
      ),
    ).toBe('ENDED');
  });

  it('종료 시각과 현재가 같으면 종료로 본다', () => {
    expect(
      getAnnouncementState(
        { isPublished: true, startsAt: PAST, endsAt: NOW.toISOString() },
        NOW,
      ),
    ).toBe('ENDED');
  });

  it('기간 안이면 게시 중이다', () => {
    expect(
      getAnnouncementState(
        { isPublished: true, startsAt: PAST, endsAt: FUTURE },
        NOW,
      ),
    ).toBe('ACTIVE');
  });
});

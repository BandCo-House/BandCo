import { describe, expect, it } from 'vitest';
import { activeAnnouncementsResponseSchema } from './schema';

const announcement = {
  announcementId: 'a1',
  title: '정기 점검 안내',
  content: '10월 10일 02:00~04:00\n서비스가 중단됩니다.',
  startsAt: null,
  endsAt: '2026-10-10T19:00:00.000Z',
};

describe('activeAnnouncementsResponseSchema', () => {
  it('게시 기간이 null이거나 ISO 문자열인 공지 목록을 통과시킨다', () => {
    expect(
      activeAnnouncementsResponseSchema.parse({
        announcements: [announcement],
      }),
    ).toEqual({ announcements: [announcement] });
  });

  it('빈 목록을 통과시킨다', () => {
    expect(
      activeAnnouncementsResponseSchema.parse({ announcements: [] }),
    ).toEqual({ announcements: [] });
  });

  it('제목이 없는 공지가 섞이면 실패한다', () => {
    expect(
      activeAnnouncementsResponseSchema.safeParse({
        announcements: [{ ...announcement, title: undefined }],
      }).success,
    ).toBe(false);
  });
});

import type { BadgeTone } from '@/shared/ui/Badge';

import type { Announcement, AnnouncementState } from './types';

export const ANNOUNCEMENT_STATE_LABELS: Record<AnnouncementState, string> = {
  ACTIVE: '게시 중',
  SCHEDULED: '예약',
  ENDED: '종료',
  PRIVATE: '비공개',
};

export const ANNOUNCEMENT_STATE_TONES: Record<AnnouncementState, BadgeTone> = {
  ACTIVE: 'green',
  SCHEDULED: 'blue',
  ENDED: 'gray',
  PRIVATE: 'yellow',
};

/**
 * 공지의 현재 게시 상태를 계산한다.
 * 공개 API(`GET /announcements/active`)의 노출 조건과 같다:
 * 게시됨 + (startsAt 없음 또는 과거) + (endsAt 없음 또는 미래).
 */
export const getAnnouncementState = (
  announcement: Pick<Announcement, 'isPublished' | 'startsAt' | 'endsAt'>,
  now: Date,
): AnnouncementState => {
  if (!announcement.isPublished) {
    return 'PRIVATE';
  }
  const nowTime = now.getTime();
  if (
    announcement.startsAt &&
    new Date(announcement.startsAt).getTime() > nowTime
  ) {
    return 'SCHEDULED';
  }
  if (
    announcement.endsAt &&
    new Date(announcement.endsAt).getTime() <= nowTime
  ) {
    return 'ENDED';
  }
  return 'ACTIVE';
};

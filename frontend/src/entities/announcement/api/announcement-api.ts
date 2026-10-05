import { apiGet } from '@/shared/api';
import {
  activeAnnouncementsResponseSchema,
  type ActiveAnnouncement,
} from '../model/schema';

/**
 * 지금 게시 중인 서비스 공지를 최신순으로 조회한다(GET /announcements/active, 인증 없음).
 */
export const getActiveAnnouncements = async (): Promise<
  ActiveAnnouncement[]
> => {
  const data = await apiGet<unknown>('/announcements/active');
  return activeAnnouncementsResponseSchema.parse(data).announcements;
};

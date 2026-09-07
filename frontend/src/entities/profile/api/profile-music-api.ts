import { z } from 'zod';
import { apiGet } from '@/shared/api';
import { profileMusicSchema } from '../model/schema';
import type { ProfileMusic } from '../model/types';

/** 외부(Deezer 등) 검색으로 받은 프로필 음악 후보. 저장형 ProfileMusic과 같은 형태다. */
export type ProfileMusicPreview = ProfileMusic;

const searchProfileMusicResultSchema = z.object({
  items: z.array(profileMusicSchema),
});

/**
 * 프로필 음악 후보를 외부에서 검색한다(GET /users/profile-music/search?q=).
 * 프로필 외 화면에서도 공용으로 쓰므로 feature가 아닌 entities에 둔다.
 */
export const searchProfileMusic = async (
  query: string,
): Promise<ProfileMusicPreview[]> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const result = await apiGet<unknown>('/users/profile-music/search', {
    params: { q: normalizedQuery },
  });

  return searchProfileMusicResultSchema.parse(result).items;
};

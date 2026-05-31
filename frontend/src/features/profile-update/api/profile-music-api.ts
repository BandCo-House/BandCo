import { z } from 'zod';
import { apiGet } from '@/shared/api';
import { profileMusicSchema } from '@/entities/profile/model/schema';

export const profileMusicSearchResultSchema = profileMusicSchema;

export type ProfileMusicSearchResult = z.infer<
  typeof profileMusicSearchResultSchema
>;

export const searchProfileMusic = async (
  query: string,
): Promise<ProfileMusicSearchResult[]> => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) return [];

  const result = await apiGet<unknown[]>('/users/profile-music/search', {
    params: { query: normalizedQuery },
  });

  return z.array(profileMusicSearchResultSchema).parse(result);
};

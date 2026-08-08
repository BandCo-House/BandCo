import { apiGet } from '@/shared/api';
import { genreListResponseSchema } from '../model/schema';
import type { Genre } from '../model/types';

/**
 * 장르 목록.
 * 백엔드는 `{ genres: [{ genreId, name }] }`로 주므로 언랩하고 `id`로 맞춰 돌려준다.
 */
export const getGenres = async (): Promise<Genre[]> => {
  const data = await apiGet<unknown>('/common/genres');
  return genreListResponseSchema
    .parse(data)
    .genres.map(({ genreId, name }) => ({ id: genreId, name }));
};

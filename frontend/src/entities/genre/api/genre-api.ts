import { apiGet } from '@/shared/api';
import { genreListResponseSchema } from '../model/schema';
import type { Genre } from '../model/types';

/** 장르 목록. 백엔드가 `{ genres }`로 감싸 돌려주므로 검증 후 배열만 꺼낸다. */
export const getGenres = async (): Promise<Genre[]> => {
  const data = await apiGet<unknown>('/common/genres');
  return genreListResponseSchema.parse(data).genres;
};

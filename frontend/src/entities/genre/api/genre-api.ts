import { apiGet } from '@/shared/api';
import type { Genre } from '../model/types';

/** 장르 목록. 백엔드가 `{ genres }`로 감싸 돌려주므로 배열만 꺼낸다. */
export const getGenres = async (): Promise<Genre[]> => {
  const { genres } = await apiGet<{ genres: Genre[] }>('/common/genres');
  return genres;
};

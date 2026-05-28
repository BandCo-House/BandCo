import { useQuery } from '@tanstack/react-query';
import { getGenres } from './genre-api';
import type { Genre } from '../model/types';

export const genreKeys = {
  all: ['genres'] as const,
  list: () => [...genreKeys.all, 'list'] as const,
};

/**
 * 동적으로 선호 음악 장르 목록을 조회 및 캐싱하는 쿼리 훅
 */
export const useGenres = (enabled: boolean = true) => {
  return useQuery<Genre[]>({
    queryKey: genreKeys.list(),
    queryFn: getGenres,
    staleTime: 5 * 60 * 1000, // 5분 캐시 유지
    enabled,
  });
};

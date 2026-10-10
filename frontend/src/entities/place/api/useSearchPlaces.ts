import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchPlaces } from './place-search-api';

export const placeSearchKeys = {
  all: ['place-search'] as const,
  query: (query: string) => [...placeSearchKeys.all, query] as const,
};

/**
 * 지도 장소 검색. 빈 검색어에서는 요청하지 않는다.
 * keepPreviousData를 쓰는 이유는 곡 검색(useSearchTracks)과 같다 — 글자를 더 칠 때마다
 * 목록이 통째로 사라졌다 다시 그려지지 않게 한다.
 */
export const useSearchPlaces = (query: string, enabled = true) =>
  useQuery({
    queryKey: placeSearchKeys.query(query),
    queryFn: () => searchPlaces(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

import { useQuery } from '@tanstack/react-query';
import { searchTracks } from './song-api';

export const trackSearchKeys = {
  all: ['track-search'] as const,
  query: (query: string) => [...trackSearchKeys.all, query] as const,
};

/**
 * 외부 음원 곡 검색. 빈 검색어에서는 요청하지 않는다.
 * 결과가 자주 바뀌지 않아 잠시 캐시해 같은 검색어 재입력 시 재요청을 막는다.
 */
export const useSearchTracks = (query: string, enabled = true) =>
  useQuery({
    queryKey: trackSearchKeys.query(query),
    queryFn: () => searchTracks(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 60_000,
  });

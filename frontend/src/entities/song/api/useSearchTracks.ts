import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchTracks } from './song-api';

export const trackSearchKeys = {
  all: ['track-search'] as const,
  query: (query: string) => [...trackSearchKeys.all, query] as const,
};

/**
 * 외부 음원 곡 검색. 빈 검색어에서는 요청하지 않는다.
 * 결과가 자주 바뀌지 않아 잠시 캐시해 같은 검색어 재입력 시 재요청을 막는다.
 *
 * keepPreviousData: 검색어가 바뀌면 queryKey가 바뀌어 data가 undefined로 떨어진다.
 * 그대로 두면 글자를 더 칠 때마다 목록이 통째로 사라졌다 다시 그려져, 응답이
 * 느린 외부 음원 검색에서 화면이 깜빡이는 것처럼 보인다. 이전 결과를 들고 있으면
 * 새 결과가 도착할 때 자리에서 교체된다.
 */
export const useSearchTracks = (query: string, enabled = true) =>
  useQuery({
    queryKey: trackSearchKeys.query(query),
    queryFn: () => searchTracks(query),
    enabled: enabled && query.trim().length > 0,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiGet } from '@/shared/api';
import type { SearchBandItem } from '@/entities/band/model/types';

export interface SearchBandsParams {
  keyword: string;
  take?: number;
}

export interface SearchBandsResponse {
  items: SearchBandItem[];
  meta: {
    count: number;
    take: number;
    cursor: { id: string; createdAt: string } | null;
    next: string | null;
  };
}

export const useBandSearch = ({ keyword, take = 20 }: SearchBandsParams) => {
  return useInfiniteQuery({
    queryKey: ['bands', 'search', keyword],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (keyword) params.append('where__name__contain', keyword);
      params.append('take', String(take));
      if (pageParam?.id) params.append('cursor__id', pageParam.id);
      if (pageParam?.createdAt)
        params.append('cursor__created_at', pageParam.createdAt);

      return apiGet<SearchBandsResponse>(`/bands/search?${params.toString()}`);
    },
    initialPageParam: undefined as
      | { id: string; createdAt: string }
      | undefined,
    getNextPageParam: (lastPage) => lastPage.meta.cursor ?? undefined,
    enabled: Boolean(keyword.trim()),
  });
};

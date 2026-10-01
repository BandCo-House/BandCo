import { useQuery } from '@tanstack/react-query';
import { searchUsers } from './user-search-api';
import type { UserSearchItem } from '../model/types';

export const userKeys = {
  all: ['users'] as const,
  search: (keyword: string) => [...userKeys.all, 'search', keyword] as const,
};

export interface UseUserSearchOptions {
  enabled?: boolean;
}

export const useUserSearch = (
  keyword: string,
  options?: UseUserSearchOptions,
) => {
  const trimmed = keyword.trim();

  return useQuery<UserSearchItem[]>({
    queryKey: userKeys.search(trimmed),
    queryFn: () => searchUsers({ nickname: trimmed }),
    enabled: options?.enabled !== false && trimmed.length > 0,
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
};

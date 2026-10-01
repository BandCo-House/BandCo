import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUserSearch, userKeys } from './useUserSearch';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUserSearch', () => {
  it('userKeys가 올바른 쿼리 키를 생성한다', () => {
    expect(userKeys.all).toEqual(['users']);
    expect(userKeys.search('김')).toEqual(['users', 'search', '김']);
  });

  it('검색어가 있으면 유저 목록을 검색하여 반환한다', async () => {
    const { result } = renderHook(() => useUserSearch('김'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.data?.[0].nickname).toContain('김');
  });

  it('검색어가 빈 문자열이면 쿼리가 실행되지 않는다', () => {
    const { result } = renderHook(() => useUserSearch(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('enabled가 false이면 검색어가 있어도 실행되지 않는다', () => {
    const { result } = renderHook(() => useUserSearch('김', { enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

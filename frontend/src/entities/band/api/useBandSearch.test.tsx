import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useBandSearch, bandSearchOptions } from './useBandSearch';

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

describe('useBandSearch', () => {
  it('bandSearchOptions가 올바른 QueryKey 및 Options 팩토리를 생성한다', () => {
    const options = bandSearchOptions('합주', 10);
    expect(options.queryKey).toEqual(['bands', 'search', '합주', 10]);
    expect(options.staleTime).toBe(30000);
  });

  it('검색어를 입력하면 밴드 목록을 검색하여 반환한다', async () => {
    const { result } = renderHook(() => useBandSearch({ keyword: '홍대' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.pages[0].items.length).toBeGreaterThan(0);
    expect(result.current.data?.pages[0].items[0].name).toContain('홍대');
  });

  it('검색어가 없으면 쿼리가 실행되지 않는다', () => {
    const { result } = renderHook(() => useBandSearch({ keyword: '' }), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

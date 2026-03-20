import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { useBandCreate } from './useBandCreate';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('useBandCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('성공 시 뮤테이션 후 리다이렉트한다', async () => {
    const { result } = renderHook(() => useBandCreate(), {
      wrapper: createTestWrapper(),
    });

    void result.current.submit({
      name: '새로운 밴드',
      description: '주 1회 합주',
      visibility: true,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(result.current.error).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
  });

  it('실패 시 에러 상태를 업데이트한다', async () => {
    server.use(
      http.post('/api/bands', () => {
        return HttpResponse.json({ success: false }, { status: 400 });
      }),
    );

    const { result } = renderHook(() => useBandCreate(), {
      wrapper: createTestWrapper(),
    });

    void result.current.submit({
      name: '실패하는 밴드',
      description: null,
      visibility: true,
    });

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 },
    );

    expect(result.current.error).toBeTruthy();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});

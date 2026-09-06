import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/app/providers/auth-context';
import { createAppRouter } from '@/app/router';
import { server } from '@/mocks/server';
import { API_URL } from '@/mocks/config';

/**
 * 탭은 header.renderBottom으로 렌더링되므로 라우터를 통째로 띄워야 검증할 수 있다.
 * "헤더 안에 있는가"까지 함께 확인되는 게 이 방식의 이점이다.
 */
const renderAt = (path: string) => {
  const router = createAppRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: [path] }),
    context: {
      user: { isLoggedIn: true, isAdmin: false },
      logout: vi.fn(),
    },
  });

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <AuthContext.Provider
      value={{
        user: { isLoggedIn: true, isAdmin: false },
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthContext.Provider>,
  );

  return router;
};

describe('알림 탭', () => {
  it('활성 탭에만 aria-current="page"를 부여해 스크린리더에 현재 탭을 알린다', async () => {
    renderAt('/notifications?tab=INVITE');

    expect(await screen.findByRole('link', { name: /초대장/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: /공지사항/ })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('헤더 안에 렌더링된다 — 본문 sticky 바가 아니라 밴드 메인 탭과 같은 자리다', async () => {
    renderAt('/notifications?tab=NOTICE');

    const tabs = await screen.findByRole('navigation', { name: '알림 탭' });
    expect(tabs.closest('header')).not.toBeNull();
  });

  it('비활성 탭에 안 읽은 알림이 있으면 dot 배지를 표시한다', async () => {
    server.use(
      http.get(`${API_URL}/notifications/unread-summary`, () =>
        HttpResponse.json({
          status: 'success',
          error: null,
          message: '성공',
          data: {
            unreadCount: 2,
            unreadByType: { NOTICE: 0, INVITE: 2, REMINDER: 0 },
          },
        }),
      ),
    );

    renderAt('/notifications?tab=NOTICE');

    await waitFor(() => {
      const inviteTab = screen.getByRole('link', { name: /초대장/ });
      const dot = inviteTab.querySelector('span');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('bg-destructive', 'h-[5px]', 'w-[5px]');
    });

    expect(
      screen.getByRole('link', { name: /공지사항/ }).querySelector('span'),
    ).toBeNull();
  });

  it('탭 전환은 히스토리를 쌓지 않는다 — 뒤로가기가 이전 탭이 아니라 이전 화면으로 가야 한다', async () => {
    const router = renderAt('/notifications?tab=NOTICE');
    await screen.findByRole('link', { name: /초대장/ });

    const lengthBefore = router.history.length;
    await router.navigate({
      to: '/notifications',
      search: { tab: 'INVITE' },
      replace: true,
    });

    expect(router.history.length).toBe(lengthBefore);
  });
});

import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/app/providers/auth-context';
import { createAppRouter } from '@/app/router';
import { server } from '@/mocks/server';
import { API_URL } from '@/mocks/config';

/**
 * RouteTabs를 실제 사용처 두 곳(알림 pill / 밴드 메인 underline)으로 검증한다.
 * 탭은 header.renderBottom으로 렌더링되므로 라우터를 통째로 띄워야 하고,
 * 그 덕에 "헤더 안에 있는가"까지 함께 확인된다.
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

describe('알림 탭 (pill)', () => {
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

  it('탭 전환은 히스토리를 쌓지 않는다 — 알림은 여러 화면에서 들어오므로 뒤로가기가 들어온 화면으로 가야 한다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/notifications?tab=NOTICE');
    const inviteTab = await screen.findByRole('link', { name: /초대장/ });

    const lengthBefore = router.history.length;
    // router.navigate가 아니라 실제 링크를 클릭한다. 직접 호출하면
    // RouteTabs의 replace 설정이 사라져도 테스트가 통과한다.
    await user.click(inviteTab);

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ tab: 'INVITE' }),
    );
    expect(router.history.length).toBe(lengthBefore);
  });
});

describe('밴드 메인 탭 (underline)', () => {
  it('히스토리를 쌓는다 — 탭마다 다른 라우트이므로 push가 맞다', async () => {
    const user = userEvent.setup();
    const router = renderAt('/band/band-1');
    const archiveTab = await screen.findByRole('link', { name: '아카이브' });

    const lengthBefore = router.history.length;
    await user.click(archiveTab);

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/band/band-1/archive'),
    );
    expect(router.history.length).toBe(lengthBefore + 1);
  });
});

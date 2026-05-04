import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, type UserAccess } from '@/app/providers/auth-context';
import { createAppRouter } from '@/app/router';

const renderWithRouter = (router: ReturnType<typeof createAppRouter>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const authContextValue = {
    user: router.options.context.user,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={authContextValue}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
};

const createRouterForTest = (initialPath: string, user: UserAccess) => {
  const router = createAppRouter();
  router.update({
    history: createMemoryHistory({
      initialEntries: [initialPath],
    }),
    context: { user },
  });

  return router;
};

const createRouterForHistoryTest = (entries: string[], user: UserAccess) => {
  const router = createAppRouter();
  router.update({
    history: createMemoryHistory({
      initialEntries: entries,
      initialIndex: entries.length - 1,
    }),
    context: { user },
  });

  return router;
};

describe('앱 라우터', () => {
  it('루트 경로에서 MyBands 페이지를 렌더링한다', async () => {
    const router = createRouterForTest('/', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(await screen.findByTestId('my-bands-page')).toBeInTheDocument();
  });

  it('로그아웃 사용자가 루트 경로로 접근하면 로그인 페이지로 리다이렉트된다', async () => {
    const router = createRouterForTest('/', {
      isLoggedIn: false,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(
      await screen.findByRole('button', { name: '로그인' }),
    ).toBeInTheDocument();
  });

  it('로그아웃 사용자가 프로필 경로로 접근하면 로그인 페이지로 리다이렉트된다', async () => {
    const router = createRouterForTest('/profile', {
      isLoggedIn: false,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(
      await screen.findByRole('button', { name: '로그인' }),
    ).toBeInTheDocument();
  });

  it('로그아웃 사용자가 비밀번호 찾기 경로로 접근하면 비밀번호 재설정 페이지를 렌더링한다', async () => {
    const router = createRouterForTest('/forgot-password', {
      isLoggedIn: false,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(
      await screen.findByRole('button', { name: '재설정 메일 보내기' }),
    ).toBeInTheDocument();
  });

  it('로그인 사용자가 비밀번호 찾기 경로로 접근하면 루트로 리다이렉트된다', async () => {
    const router = createRouterForTest('/forgot-password', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(await screen.findByTestId('my-bands-page')).toBeInTheDocument();
  });

  it('로그아웃 사용자가 온보딩 경로로 접근하면 로그인 페이지로 리다이렉트된다', async () => {
    const router = createRouterForTest('/onboarding', {
      isLoggedIn: false,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(
      await screen.findByRole('button', { name: '로그인' }),
    ).toBeInTheDocument();
  });

  it('로그인 사용자가 온보딩 경로로 접근하면 온보딩 페이지를 렌더링한다', async () => {
    const router = createRouterForTest('/onboarding?name=테스터', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(
      await screen.findByRole('heading', {
        name: /반가워요, 테스터님\s+어떤 음악을 추구하나요/i,
      }),
    ).toBeInTheDocument();
  });

  it('로그인 사용자가 프로필 경로로 접근하면 프로필 페이지를 렌더링한다', async () => {
    const router = createRouterForTest('/profile', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(await screen.findByText('ProfilePage')).toBeInTheDocument();
  });

  it('일반 사용자가 관리자 경로로 접근하면 루트로 리다이렉트된다', async () => {
    const router = createRouterForTest('/admin', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(await screen.findByTestId('my-bands-page')).toBeInTheDocument();
  });

  it('관리자 사용자가 관리자 경로로 접근하면 관리자 페이지를 렌더링한다', async () => {
    const router = createRouterForTest('/admin', {
      isLoggedIn: true,
      isAdmin: true,
    });

    renderWithRouter(router);

    expect(await screen.findByText('AdminPage')).toBeInTheDocument();
  });

  it('밴드 곡 라이브러리 경로에서는 곡 라이브러리 탭이 active 상태다', async () => {
    const router = createRouterForTest('/band/1/songs', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    await screen.findByText('SongsPage');

    expect(
      screen.getByRole('button', { name: '곡 라이브러리' }),
    ).toHaveAttribute('data-variant', 'default');
    expect(screen.getByRole('button', { name: '캘린더' })).toHaveAttribute(
      'data-variant',
      'outline',
    );
  });

  it('밴드 곡 라이브러리에서 캘린더 탭 클릭 시 해당 공연 캘린더로 이동한다', async () => {
    const router = createRouterForTest('/band/1/songs', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    await screen.findByText('SongsPage');
    fireEvent.click(screen.getByRole('button', { name: '캘린더' }));

    expect(await screen.findByText('BandDetailPage')).toBeInTheDocument();
  });

  it('공연 상세에서 곡 라이브러리 탭으로 이동 후 캘린더 탭을 누르면 동일 공연으로 돌아온다', async () => {
    const router = createRouterForTest('/band/1/space/1', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    await screen.findByText('BandPerformancePage');
    fireEvent.click(screen.getByRole('button', { name: '곡 라이브러리' }));
    await screen.findByText('SongsPage');
    fireEvent.click(screen.getByRole('button', { name: '캘린더' }));

    expect(await screen.findByText('BandPerformancePage')).toBeInTheDocument();
  });

  it('공연 상세 경로에서는 캘린더 탭이 active 상태다', async () => {
    const router = createRouterForTest('/band/1/space/1', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    await screen.findByText('BandPerformancePage');

    expect(screen.getByRole('button', { name: '캘린더' })).toHaveAttribute(
      'data-variant',
      'default',
    );
    expect(
      screen.getByRole('button', { name: '곡 라이브러리' }),
    ).toHaveAttribute('data-variant', 'outline');
  });

  it('루트에서 검색바가 노출된다', async () => {
    const rootRouter = createRouterForTest('/', {
      isLoggedIn: true,
      isAdmin: false,
    });

    const { unmount } = renderWithRouter(rootRouter);
    expect(await screen.findByTestId('my-bands-page')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('밴드/사용자를 찾아보세요'),
    ).toBeInTheDocument();
    unmount();

    const songsRouter = createRouterForTest('/band/1/songs?spaceId=1', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(songsRouter);
    expect(await screen.findByText('SongsPage')).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('밴드/사용자를 찾아보세요'),
    ).not.toBeInTheDocument();
  });

  it('루트 경로의 본문 셸은 헤더와 동일한 최대 너비 클래스를 사용해야 한다', async () => {
    const router = createRouterForTest('/', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    expect(await screen.findByTestId('my-bands-page')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveClass(
      'mx-auto',
      'w-full',
      'max-w-7xl',
      'px-6',
    );
  });

  it('프로필 페이지에서는 우측 프로필 아바타를 렌더링하지 않는다', async () => {
    const profileRouter = createRouterForTest('/profile', {
      isLoggedIn: true,
      isAdmin: false,
    });
    const { unmount } = renderWithRouter(profileRouter);

    expect(await screen.findByText('ProfilePage')).toBeInTheDocument();
    expect(screen.queryByLabelText('프로필 열기')).not.toBeInTheDocument();
    unmount();
  });

  it('밴드 상세의 뒤로가기는 루트(MyBands)로 이동한다', async () => {
    const router = createRouterForTest('/band/1', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    await screen.findByText('BandDetailPage');
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(await screen.findByTestId('my-bands-page')).toBeInTheDocument();
  });

  it('프로필의 뒤로가기는 브라우저 history back 동작을 사용한다', async () => {
    const router = createRouterForHistoryTest(['/', '/profile'], {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    await screen.findByText('ProfilePage');
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(await screen.findByTestId('my-bands-page')).toBeInTheDocument();
  });

  it('팀 상세의 뒤로가기는 해당 곡의 팀 목록으로 이동한다', async () => {
    const router = createRouterForTest('/song/1/team/1', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    await screen.findByText('TeamDetailPage');
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(await screen.findByText('SongTeamsPage')).toBeInTheDocument();
  });

  it('공연 상세(캘린더)의 뒤로가기는 밴드 상세로 이동한다', async () => {
    const router = createRouterForTest('/band/1/space/1', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    await screen.findByText('BandPerformancePage');
    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(await screen.findByText('BandDetailPage')).toBeInTheDocument();
  });

  it('공연 상세의 우측 설정 버튼은 공연 설정 페이지로 이동한다', async () => {
    const router = createRouterForTest('/band/1/space/1', {
      isLoggedIn: true,
      isAdmin: false,
    });

    renderWithRouter(router);

    await screen.findByText('BandPerformancePage');
    fireEvent.click(screen.getByRole('button', { name: '설정' }));

    expect(
      await screen.findByText('PerformanceSettingsPage'),
    ).toBeInTheDocument();
  });
});

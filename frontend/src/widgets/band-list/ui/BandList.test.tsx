import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/mocks/server';
import { AuthContext } from '@/app/providers/auth-context';
import { BandList } from './BandList';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // 밴드 만들기 모달의 멤버 초대 검색이 로그인 사용자를 후보에서 빼려고 auth context를 읽는다.
  return render(
    <AuthContext.Provider
      value={{
        user: { isLoggedIn: true, isAdmin: false, id: 'user-001' },
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </AuthContext.Provider>,
  );
};

describe('BandList', () => {
  it('밴드 목록을 렌더링한다', async () => {
    renderWithClient(<BandList />);

    expect(await screen.findByText('합주하자')).toBeInTheDocument();
    expect(screen.getByText('락스타')).toBeInTheDocument();
  });

  it('밴드가 있으면 새 밴드 FAB과 초대코드 참여 링크를 메뉴 없이 바로 보여준다', async () => {
    renderWithClient(<BandList />);

    expect(
      await screen.findByRole('button', { name: '새 밴드' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '초대코드로 참여하기' }),
    ).toBeInTheDocument();
  });

  it('로딩 중일 때 로딩 상태를 표시한다', async () => {
    server.use(
      http.get('/api/bands/me', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );

    renderWithClient(<BandList />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('밴드가 없을 때 빈 상태를 표시한다', async () => {
    server.use(
      http.get('/api/bands/me', () => {
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '내 밴드 목록 조회 성공',
          data: {
            items: [],
            meta: {
              count: 0,
              take: 20,
              cursor: null,
              next: null,
            },
          },
        });
      }),
    );

    renderWithClient(<BandList />);
    expect(
      await screen.findByText('아직 참여한 밴드가 없어요'),
    ).toBeInTheDocument();
    // 빈 화면에서는 두 행동을 본문에 두고, 같은 행동을 FAB으로 겹쳐 띄우지 않는다.
    expect(
      screen.getByRole('button', { name: '새 밴드 만들기' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '초대코드로 참여' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '새 밴드' })).toBeNull();
  });
});

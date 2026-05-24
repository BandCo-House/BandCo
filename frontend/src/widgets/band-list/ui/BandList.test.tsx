import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/mocks/server';
import { BandList } from './BandList';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('BandList', () => {
  it('밴드 목록을 렌더링한다', async () => {
    renderWithClient(<BandList />);

    expect(await screen.findByText('합주하자')).toBeInTheDocument();
    expect(screen.getByText('락스타')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '밴드 메뉴 열기' }),
    ).toBeInTheDocument();
  });

  it('로딩 중일 때 로딩 상태를 표시한다', async () => {
    server.use(
      http.get('/api/bands', async () => {
        await delay('infinite');
        return HttpResponse.json({});
      }),
    );

    renderWithClient(<BandList />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('밴드가 없을 때 빈 상태를 표시한다', async () => {
    server.use(
      http.get('/api/bands', () => {
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '내 밴드 목록 조회 성공',
          data: {
            totalCount: 0,
            bands: [],
          },
        });
      }),
    );

    renderWithClient(<BandList />);
    expect(
      await screen.findByText('아직 참여한 밴드가 없어요'),
    ).toBeInTheDocument();
  });

  it('배경 백드롭에 은은한 상단 샤이닝 효과 클래스를 포함한다', async () => {
    renderWithClient(<BandList />);
    expect(await screen.findByText('합주하자')).toBeInTheDocument();

    const section = screen.getByTestId('band-list');
    const backdrop = section.querySelector('.fixed.top-20');
    expect(backdrop).toBeInTheDocument();
    expect(backdrop).toHaveClass('to-primary/15');
    expect(backdrop).toHaveClass('border-t');
    expect(backdrop).toHaveClass('border-primary/20');
  });
});

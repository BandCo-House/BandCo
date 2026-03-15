import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { server } from '@/mocks/server';
import { BandList } from './BandList';

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

    expect(await screen.findByText('홍대 인디 밴드')).toBeInTheDocument();
    expect(screen.getByText('직장인 연합 밴드')).toBeInTheDocument();
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
        return HttpResponse.json({ success: true, data: [] });
      }),
    );

    renderWithClient(<BandList />);
    expect(
      await screen.findByText('아직 참여한 밴드가 없어요'),
    ).toBeInTheDocument();
  });
});

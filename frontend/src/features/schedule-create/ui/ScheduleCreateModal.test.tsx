import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { ScheduleCreateModal } from './ScheduleCreateModal';

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  };
};

describe('ScheduleCreateModal', () => {
  it('모달을 열면 초기 스텝으로 합주/회의 선택 화면이 보인다', () => {
    renderWithClient(<ScheduleCreateModal isOpen={true} onClose={vi.fn()} initialDate={new Date('2026-03-19')} />);

    expect(screen.getByText('새 일정 추가')).toBeInTheDocument();
    expect(screen.getByText('어떤 일정을 만드시겠어요?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /합주 연습/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /회의/ })).toBeInTheDocument();
  });

  it('합주 연습(PRACTICE)을 선택하면 합주 1스텝 폼이 보인다', async () => {
    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal isOpen={true} onClose={vi.fn()} initialDate={new Date('2026-03-19')} />);

    await user.click(screen.getByRole('button', { name: /합주 연습/ }));

    expect(screen.getByText(/합주 연습 기본 정보/)).toBeInTheDocument();
  });

  it('[PRACTICE] 모든 필드를 입력하고 다음을 누르면 곡 선택 화면(2스텝)으로 넘어간다', async () => {
    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal isOpen={true} onClose={vi.fn()} initialDate={new Date('2026-03-19')} />);
    await user.click(screen.getByRole('button', { name: /합주 연습/ }));

    // 1스텝 입력
    await user.selectOptions(screen.getByLabelText(/장소/), 'place-3');

    const nextButton = screen.getByRole('button', { name: /다음 단계로/ });
    expect(nextButton).not.toBeDisabled();

    await user.click(nextButton);

    // 2스텝(곡 선택) 전환 검증
    expect(screen.getByText(/곡 선택 스텝/)).toBeInTheDocument();
  });

  it('[PRACTICE] 3스텝까지 완료 후 생성 시 올바른 페이로드로 API가 호출된다', async () => {
    const payloadSpy = vi.fn();
    server.use(
      http.post('/api/schedule', async ({ request }) => {
        const body = await request.json();
        payloadSpy(body);
        return HttpResponse.json({ status: 'success', data: { scheduleId: 'test-id' } });
      }),
    );

    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal isOpen={true} onClose={vi.fn()} initialDate={new Date('2026-03-19')} />);

    // 1스텝
    await user.click(screen.getByRole('button', { name: /합주 연습/ }));
    await user.selectOptions(screen.getByLabelText(/장소/), 'place-3');
    await user.click(screen.getByRole('button', { name: /다음 단계로/ }));

    // 2스텝 (곡 선택)
    const songRadios = screen.getAllByRole('radio');
    await user.click(songRadios[0]); // song-1
    await user.click(screen.getByRole('button', { name: /다음/ }));

    // 3스텝 (팀 선택)
    const teamRadios = screen.getAllByRole('radio');
    await user.click(teamRadios[0]); // team-1
    await user.click(screen.getByRole('button', { name: /생성 완료/ }));

    // API 검증
    await waitFor(() => {
      expect(payloadSpy).toHaveBeenCalledWith(expect.objectContaining({
        scheduleType: 'PRACTICE',
        title: expect.stringContaining('2026-03-19'),
        startAt: '2026-03-19T19:00:00Z',
        endAt: '2026-03-19T21:00:00Z',
        placeId: 'place-3',
        songId: 'song-1',
        teamId: 'team-1',
        status: 'PLANNED'
      }));
    });
  });

  it('[MEETING] 모든 필드를 입력하고 생성 시 올바른 페이로드로 API가 호출된다', async () => {
    const payloadSpy = vi.fn();
    server.use(
      http.post('/api/schedule', async ({ request }) => {
        const body = await request.json();
        payloadSpy(body);
        return HttpResponse.json({ status: 'success', data: { scheduleId: 'test-id' } });
      }),
    );

    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal isOpen={true} onClose={vi.fn()} initialDate={new Date('2026-03-20')} />);

    // 타입 선택
    await user.click(screen.getByRole('button', { name: /회의/ }));

    // 1스텝 입력
    await user.type(screen.getByLabelText(/회의 제목/), '기획 회의');
    await user.type(screen.getByLabelText(/메모/), '회의 안건 1');
    await user.click(screen.getByRole('button', { name: /참여자 선택하러 가기/ }));

    // 2스텝 (참여자 선택)
    const toggleAllBtn = screen.getByRole('button', { name: /전원 선택/ });
    await user.click(toggleAllBtn);
    await user.click(screen.getByRole('button', { name: /생성 완료/ }));

    // API 검증
    await waitFor(() => {
      expect(payloadSpy).toHaveBeenCalledWith(expect.objectContaining({
        scheduleType: 'MEETING',
        title: '기획 회의',
        startAt: '2026-03-20T19:00:00Z',
        endAt: '2026-03-20T21:00:00Z',
        memo: '회의 안건 1',
        status: 'PLANNED'
      }));
    });
  });
});

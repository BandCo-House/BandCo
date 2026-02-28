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
    renderWithClient(<ScheduleCreateModal />);

    expect(screen.getByText('새 일정 추가')).toBeInTheDocument();
    expect(screen.getByText('어떤 일정을 만드시겠어요?')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '합주 연습' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회의' })).toBeInTheDocument();
  });

  it('합주 연습을 선택하면 합주 1스텝 폼이 보인다', async () => {
    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal />);

    await user.click(screen.getByRole('button', { name: '합주 연습' }));

    expect(screen.getByText('합주 연습 기본 정보')).toBeInTheDocument();
  });

  it('[합주 1스텝] 필수 필드를 하나라도 비우면 다음 버튼이 비활성화된다', async () => {
    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal />);
    await user.click(screen.getByRole('button', { name: '합주 연습' }));

    const nextButton = screen.getByRole('button', { name: '다음' });
    expect(nextButton).toBeDisabled();

    // 일부 필드만 입력 (날짜)
    await user.type(screen.getByLabelText('날짜'), '2026-03-01');
    expect(nextButton).toBeDisabled();
  });

  it('[합주 1스텝] 모든 필드를 입력하고 다음을 누르면 곡 선택 화면(2스텝)으로 넘어간다', async () => {
    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal />);
    await user.click(screen.getByRole('button', { name: '합주 연습' }));

    // 전체 필드 입력
    await user.type(screen.getByLabelText('날짜'), '2026-03-01');
    await user.type(screen.getByLabelText('시작 시간'), '14:00');
    await user.type(screen.getByLabelText('종료 시간'), '16:00');
    await user.selectOptions(screen.getByLabelText('장소'), '홍대 합주실');

    const nextButton = screen.getByRole('button', { name: '다음' });
    expect(nextButton).not.toBeDisabled();

    await user.click(nextButton);

    // 전환 검증
    expect(screen.getByTestId('ensemble-step-2')).toBeInTheDocument(); // 곡 선택 스텝
    expect(screen.queryByText('합주 연습 기본 정보')).not.toBeInTheDocument();
  });

  it('[합주 2스텝] 곡을 하나 이상 선택하고 다음을 누르면 팀 선택 화면(3스텝)으로 넘어간다', async () => {
    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal />);

    // 1스텝 패스
    await user.click(screen.getByRole('button', { name: '합주 연습' }));
    await user.type(screen.getByLabelText('날짜'), '2026-03-01');
    await user.type(screen.getByLabelText('시작 시간'), '14:00');
    await user.type(screen.getByLabelText('종료 시간'), '16:00');
    await user.selectOptions(screen.getByLabelText('장소'), '홍대 합주실');
    await user.click(screen.getByRole('button', { name: '다음' }));

    // 2스텝 진입 검증
    expect(screen.getByText('곡 선택 스텝')).toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: '다음' });
    expect(nextButton).toBeDisabled(); // 초기 상태는 0개 선택이므로 비활성화

    // 첫 번째 곡 체킹 (Mock 데이터 기반으로 임의 체크박스를 클릭한다고 가정)
    const radios = screen.getAllByRole('radio');
    await user.click(radios[0]);

    expect(nextButton).not.toBeDisabled();
    await user.click(nextButton);

    // 3스텝(팀 선택) 전환 검증
    expect(screen.getByTestId('ensemble-step-3')).toBeInTheDocument();
    expect(screen.queryByText('곡 선택 스텝')).not.toBeInTheDocument();
  });

  it('회의를 선택하면 회의 1스텝 폼이 보인다', async () => {
    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal />);

    await user.click(screen.getByRole('button', { name: '회의' }));

    expect(screen.getByTestId('meeting-step-1')).toBeInTheDocument();
    expect(screen.queryByTestId('type-select-step')).not.toBeInTheDocument();
  });

  it('[합주 3스텝] 팀을 선택하고 생성 완료를 누르면 올바른 POST API가 호출된다', async () => {
    const payloadSpy = vi.fn();
    server.use(
      http.post('/api/schedule', async ({ request }) => {
        const body = await request.json();
        payloadSpy(body);
        return HttpResponse.json({ success: true });
      }),
    );

    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal />);

    // 1스텝 패스
    await user.click(screen.getByRole('button', { name: '합주 연습' }));
    await user.type(screen.getByLabelText('날짜'), '2026-03-01');
    await user.type(screen.getByLabelText('시작 시간'), '14:00');
    await user.type(screen.getByLabelText('종료 시간'), '16:00');
    await user.selectOptions(screen.getByLabelText('장소'), '홍대 합주실');
    await user.click(screen.getByRole('button', { name: '다음' }));

    // 2스텝 패스
    const songRadios = screen.getAllByRole('radio');
    await user.click(songRadios[0]); // song-1
    await user.click(screen.getByRole('button', { name: '다음' }));

    // 3스텝 진입
    expect(screen.getByText('팀 선택 스텝')).toBeInTheDocument();
    const submitButton = screen.getByRole('button', { name: '생성 완료' });
    expect(submitButton).toBeDisabled();

    // 3스텝 패스
    const radios = screen.getAllByRole('radio');
    await user.click(radios[0]); // team-1
    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    // API 검증
    await waitFor(() => {
      expect(payloadSpy).toHaveBeenCalledWith({
        type: 'ensemble',
        date: '2026-03-01',
        startTime: '14:00',
        endTime: '16:00',
        place: '홍대 합주실',
        songId: 'song-1',
        teamId: 'team-1',
      });
    });
  });

  it('[회의 플로우] 1~3스텝을 거쳐 생성 완료 시 올바른 POST API가 호출된다', async () => {
    const payloadSpy = vi.fn();
    server.use(
      http.post('/api/schedule', async ({ request }) => {
        const body = await request.json();
        payloadSpy(body);
        return HttpResponse.json({ success: true });
      }),
    );

    const user = userEvent.setup();
    renderWithClient(<ScheduleCreateModal />);

    // 1스텝: 회의 선택 및 폼 입력
    await user.click(screen.getByRole('button', { name: '회의' }));

    expect(screen.getByText('회의 기본 정보')).toBeInTheDocument();
    const nextBtn1 = screen.getByRole('button', { name: '다음' });
    expect(nextBtn1).toBeDisabled();

    await user.type(screen.getByLabelText('회의명'), '정기 기획 회의');
    await user.type(screen.getByLabelText('날짜'), '2026-03-02');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');
    await user.type(screen.getByLabelText('종료 시간'), '12:00');
    expect(nextBtn1).not.toBeDisabled();

    await user.click(nextBtn1);

    // 2스텝: 참여 인원 및 메모 선택
    expect(screen.getByText('참여 인원 및 메모 스텝')).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: '생성 완료' });
    expect(submitBtn).toBeDisabled();

    // 전원 선택 토글 체킹
    const toggleAllBtn = screen.getByRole('button', { name: '전원 선택' });
    await user.click(toggleAllBtn); // 전체 선택
    expect(submitBtn).not.toBeDisabled();

    // 다시 누르면 해제
    await user.click(toggleAllBtn); // 전체 해제
    expect(submitBtn).toBeDisabled();

    // 한 명만 수동 선택
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]); // member-1
    expect(submitBtn).not.toBeDisabled();

    // 메모 입력
    await user.type(screen.getByLabelText('메모'), '중요 안건 논의 필요');
    await user.click(submitBtn);

    // 최종 API 검증
    await waitFor(() => {
      expect(payloadSpy).toHaveBeenCalledWith({
        type: 'meeting',
        title: '정기 기획 회의',
        date: '2026-03-02',
        startTime: '10:00',
        endTime: '12:00',
        memberIds: ['member-1'],
        memo: '중요 안건 논의 필요',
      });
    });
  });
});

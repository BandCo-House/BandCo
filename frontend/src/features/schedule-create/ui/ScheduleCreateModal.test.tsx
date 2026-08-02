import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ScheduleCreateModal } from './ScheduleCreateModal';

const renderModal = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ScheduleCreateModal
        isOpen
        onClose={vi.fn()}
        spaceId="space-1"
        bandId="band-1"
        initialDate={new Date('2026-03-19')}
      />
    </QueryClientProvider>,
  );
};

describe('ScheduleCreateModal', () => {
  it('열면 일정 추가 폼이 합주 기본으로 보이고 추가는 비활성이다', () => {
    renderModal();

    expect(screen.getByText('일정 추가')).toBeInTheDocument();
    expect(screen.getByText('합주 이름')).toBeInTheDocument();
    expect(screen.getByText('합주곡')).toBeInTheDocument();
    // 필수(이름·장소·곡) 미입력이라 추가 CTA는 비활성.
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
  });

  it('회의로 전환하면 회의 필드로 바뀐다', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: '회의' }));

    expect(screen.getByText('회의 이름')).toBeInTheDocument();
    expect(screen.getByText('참여자')).toBeInTheDocument();
    expect(screen.queryByText('합주곡')).not.toBeInTheDocument();
  });

  it('이름만 입력해도 장소·곡이 없으면 추가는 비활성이다', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText('합주 이름'), '합주 A');

    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
  });
});

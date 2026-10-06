import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { BandUserInviteModal } from './BandUserInviteModal';
import * as inviteApi from '@/features/invite-create/api/invite-api';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('BandUserInviteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('모달이 열리면 사용자 검색 헤더와 검색창이 렌더링된다', () => {
    render(
      <BandUserInviteModal
        open={true}
        onOpenChange={vi.fn()}
        bandId="band-001"
      />,
      { wrapper: createWrapper() },
    );

    expect(
      screen.getByRole('heading', { name: '사용자 검색' }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('이름으로 검색하세요'),
    ).toBeInTheDocument();
  });

  it('초기 검색어가 주어지면 검색 결과가 렌더링된다', async () => {
    render(
      <BandUserInviteModal
        open={true}
        onOpenChange={vi.fn()}
        bandId="band-001"
        initialQuery="김"
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText('김나영')).toBeInTheDocument();
    });
    expect(screen.getByText('김지훈')).toBeInTheDocument();
    expect(screen.getByText('김민')).toBeInTheDocument();
  });

  it('유저를 클릭하면 상단에 칩과 총 인원 수가 표시되고 추가 버튼이 활성화된다', async () => {
    const user = userEvent.setup();
    render(
      <BandUserInviteModal
        open={true}
        onOpenChange={vi.fn()}
        bandId="band-001"
        initialQuery="김"
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText('김나영')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: '추가' });
    expect(addButton).toBeDisabled();

    // 김나영 클릭하여 선택
    await user.click(screen.getByText('김나영'));

    // 상단에 총 1명 표시 및 추가 버튼 활성화 확인
    expect(screen.getByText('총 1명')).toBeInTheDocument();
    expect(addButton).not.toBeDisabled();

    // 칩의 X 버튼 클릭하여 선택 해제
    const removeBtn = screen.getByRole('button', { name: '김나영 선택 해제' });
    await user.click(removeBtn);

    expect(screen.queryByText('총 1명')).not.toBeInTheDocument();
    expect(addButton).toBeDisabled();
  });

  it('추가 버튼 클릭 시 createInvite가 호출되고 onSuccess 콜백이 호출된다', async () => {
    const user = userEvent.setup();
    const handleSuccess = vi.fn();
    const handleOpenChange = vi.fn();

    const spyCreateInvite = vi
      .spyOn(inviteApi, 'createInvite')
      .mockResolvedValueOnce({
        invitationId: 'invite-1',
        bandId: 'band-001',
        inviterUserId: 'me',
        inviteeUserId: 'user-kim-001',
        invitationStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      });

    render(
      <BandUserInviteModal
        open={true}
        onOpenChange={handleOpenChange}
        bandId="band-001"
        initialQuery="김"
        onSuccess={handleSuccess}
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText('김나영')).toBeInTheDocument();
    });

    await user.click(screen.getByText('김나영'));
    const addButton = screen.getByRole('button', { name: '추가' });
    await user.click(addButton);

    await waitFor(() => {
      expect(spyCreateInvite).toHaveBeenCalledWith('band-001', {
        inviteeUserId: 'user-kim-001',
      });
      expect(handleSuccess).toHaveBeenCalledWith(1);
      expect(handleOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

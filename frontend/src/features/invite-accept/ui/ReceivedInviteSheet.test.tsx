import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { toast } from 'sonner';
import { ReceivedInviteSheet } from './ReceivedInviteSheet';
import type { NotificationItem } from '@/entities/notification/model/types';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockNoti: NotificationItem = {
  notificationId: 'noti-invite-123',
  type: 'INVITE',
  title: '밴드 초대',
  description: '김민준님이 신촌 락밴드 밴드로 초대했습니다.',
  isRead: false,
  targetPath: '/invitations/received?invitationId=uuid-invite-123',
  reference: {
    type: 'BAND_INVITATION',
    id: 'uuid-invite-123',
    status: 'PENDING',
    sender: {
      userId: 'user-sender-123',
      nickname: '김민준',
      avatarUrl: null,
    },
  },
  createdAt: '2026-06-12T00:00:00Z',
};

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('ReceivedInviteSheet', () => {
  beforeEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();

    // Mock single invitation detail endpoint for all test cases
    server.use(
      http.get('*/invitations/:invitationId', ({ params }) => {
        const { invitationId } = params;
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '초대 조회 성공',
          data: {
            invitationId: String(invitationId),
            band: {
              bandId: 'mock-band-id',
              name: '신촌 락밴드',
              description: '신촌 락밴드입니다.',
            },
            inviter: {
              userId: 'user-sender-123',
              nickname: '김민준',
            },
            message: '우리 같이 음악해요!',
            invitationStatus: 'PENDING',
            createdAt: '2026-06-12T00:00:00.000Z',
          },
        });
      }),
      http.get('*/bands/:bandId', ({ params }) => {
        const { bandId } = params;
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '밴드 조회 성공',
          data: {
            band: {
              id: String(bandId),
              name: '신촌 락밴드',
              description: '신촌 락밴드입니다.',
              visibility: true,
              coverImgUrl: null,
              bandMasterUserId: 'user-sender-123',
              genres: [],
              memberCount: 5,
              createdAt: '2026-06-01T00:00:00.000Z',
            },
          },
        });
      }),
    );
  });

  it('초대 알림 description에서 초대자 이름과 밴드 이름을 파싱하여 정상 렌더링한다', () => {
    renderWithClient(
      <ReceivedInviteSheet
        isOpen={true}
        onOpenChange={vi.fn()}
        noti={mockNoti}
      />,
    );

    expect(screen.getByText('밴드 초대장')).toBeInTheDocument();
    expect(screen.getByText('김민준님이 회원님을')).toBeInTheDocument();
    expect(screen.getByText('신촌 락밴드에 초대했습니다')).toBeInTheDocument();
  });

  it('밴드 요약 정보 카드 통계 및 멤버들이 정상 렌더링된다', async () => {
    renderWithClient(
      <ReceivedInviteSheet
        isOpen={true}
        onOpenChange={vi.fn()}
        noti={mockNoti}
      />,
    );

    expect(screen.getByText('신촌 락밴드는 이런 밴드에요')).toBeInTheDocument();
    expect(await screen.findByText('5')).toBeInTheDocument(); // 동적 멤버 수
    expect(screen.getByText('멤버')).toBeInTheDocument();
  });

  it('수락하고 참여하기 버튼 클릭 시 acceptInvite API가 성공적으로 호출되고 토스트를 표시한다', async () => {
    let apiCalled = false;
    server.use(
      http.post('*/invitations/uuid-invite-123/accept', () => {
        apiCalled = true;
        return HttpResponse.json({
          success: true,
          data: {
            invitationId: 'uuid-invite-123',
            bandId: 'mock-band-id',
            userId: 'user-123',
            invitationStatus: 'ACCEPTED',
            joinedAt: '2026-04-30T10:00:00.000Z',
          },
        });
      }),
      http.patch('*/notifications/noti-invite-123/read', () => {
        return HttpResponse.json({ success: true, data: null });
      }),
    );

    const onOpenChange = vi.fn();
    renderWithClient(
      <ReceivedInviteSheet
        isOpen={true}
        onOpenChange={onOpenChange}
        noti={mockNoti}
      />,
    );

    const acceptBtn = screen.getByRole('button', { name: '수락하고 참여하기' });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(apiCalled).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('초대를 수락했습니다!');
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/band/mock-band-id' });
    });
  });

  it('거절 버튼 클릭 시 declineInvite API가 성공적으로 호출되고 토스트를 표시한다', async () => {
    let apiCalled = false;
    server.use(
      http.post('*/invitations/uuid-invite-123/decline', () => {
        apiCalled = true;
        return HttpResponse.json({ success: true, data: null });
      }),
      http.patch('*/notifications/noti-invite-123/read', () => {
        return HttpResponse.json({ success: true, data: null });
      }),
    );

    const onOpenChange = vi.fn();
    renderWithClient(
      <ReceivedInviteSheet
        isOpen={true}
        onOpenChange={onOpenChange}
        noti={mockNoti}
      />,
    );

    const declineBtn = screen.getByRole('button', { name: '거절' });
    fireEvent.click(declineBtn);

    await waitFor(() => {
      expect(apiCalled).toBe(true);
      expect(toast.success).toHaveBeenCalledWith('초대를 거절했습니다.');
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('이미 수락 완료된 초대장인 경우, 이미 수락한 초대장입니다 라는 상태를 노출하고 수락/거절 버튼을 노출하지 않는다', () => {
    const mockAcceptedNoti = {
      ...mockNoti,
      isRead: true,
      reference: {
        type: 'BAND_INVITATION' as const,
        id: 'invite-123',
        status: 'ACCEPTED' as const,
        sender: null,
      },
    };

    renderWithClient(
      <ReceivedInviteSheet
        isOpen={true}
        onOpenChange={vi.fn()}
        noti={mockAcceptedNoti}
      />,
    );

    expect(screen.getByText('이미 수락한 초대장입니다')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '수락하고 참여하기' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '거절' }),
    ).not.toBeInTheDocument();
  });

  it('알림이 읽음 상태(isRead: true)이더라도 초대 상태가 PENDING이면 수락/거절 버튼이 정상 노출된다', () => {
    const mockReadPendingNoti = {
      ...mockNoti,
      isRead: true,
      reference: {
        type: 'BAND_INVITATION' as const,
        id: 'invite-123',
        status: 'PENDING' as const,
        sender: null,
      },
    };

    renderWithClient(
      <ReceivedInviteSheet
        isOpen={true}
        onOpenChange={vi.fn()}
        noti={mockReadPendingNoti}
      />,
    );

    expect(
      screen.getByRole('button', { name: '수락하고 참여하기' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '거절' })).toBeInTheDocument();
  });
});

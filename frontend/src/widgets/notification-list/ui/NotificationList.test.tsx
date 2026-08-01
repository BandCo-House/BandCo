import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { NotificationList } from './NotificationList';

import { fireEvent } from '@testing-library/react';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe('NotificationList', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('공지사항 탭일 때 공지사항 알림 목록을 요청하고 렌더링한다', async () => {
    server.use(
      http.get('/api/notifications/me', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('where__type')).toBe('NOTICE');
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '성공',
          data: {
            items: [
              {
                notificationId: 'noti-notice',
                type: 'NOTICE',
                title: '공지사항 알림',
                description: '내용입니다.',
                isRead: false,
                targetPath: '',
                createdAt: '2026-06-12T00:00:00Z',
              },
            ],
            meta: { count: 1, take: 20, next: null },
          },
        });
      }),
    );

    renderWithClient(<NotificationList tab="NOTICE" />);

    expect(await screen.findByText('공지사항 알림')).toBeInTheDocument();
  });

  it('비활성 탭에 안 읽은 알림이 있을 경우 #D6705C 색상의 dot 배지를 표시한다', async () => {
    server.use(
      http.get('/api/notifications/unread-summary', () => {
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '성공',
          data: {
            unreadCount: 2,
            unreadByType: {
              NOTICE: 0,
              INVITE: 2,
              REMINDER: 0,
            },
          },
        });
      }),
      http.get('/api/notifications/me', () => {
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '성공',
          data: {
            items: [],
            meta: { count: 0, take: 20, next: null },
          },
        });
      }),
    );

    renderWithClient(<NotificationList tab="NOTICE" />);

    await waitFor(() => {
      const inviteTabBtn = screen.getByRole('button', { name: /초대장/ });
      const dotBadge = inviteTabBtn.querySelector('span');
      expect(dotBadge).toBeInTheDocument();
      expect(dotBadge).toHaveClass('bg-[#D6705C]');
      expect(dotBadge).toHaveClass('h-[5px]', 'w-[5px]');
    });
  });

  it('모두 읽음 버튼이 알약(캡슐) 모양의 스타일(border-grey-300 rounded-full)로 표시된다', async () => {
    server.use(
      http.get('/api/notifications/me', () => {
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '성공',
          data: {
            items: [
              {
                notificationId: 'noti-1',
                type: 'NOTICE',
                title: '안읽은 알림',
                description: '내용',
                isRead: false,
                targetPath: '',
                createdAt: '2026-06-12T00:00:00Z',
              },
            ],
            meta: { count: 1, take: 20, next: null },
          },
        });
      }),
    );

    renderWithClient(<NotificationList tab="NOTICE" />);

    const markAllBtn = await screen.findByRole('button', { name: '모두 읽음' });
    expect(markAllBtn).toBeInTheDocument();
    expect(markAllBtn).toHaveClass(
      'rounded-full',
      'border',
      'border-grey-300',
      'px-4',
      'py-1.5',
    );
  });

  it('초대장 알림 리스트에서 수락 클릭 시 acceptInvite API가 성공적으로 호출되고 밴드로 이동한다', async () => {
    let acceptApiCalled = false;

    server.use(
      http.get('/api/notifications/me', () => {
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '성공',
          data: {
            items: [
              {
                notificationId: 'noti-invite-999',
                type: 'INVITE',
                title: '밴드 초대',
                description: '합주하자 밴드로 초대했습니다.',
                isRead: false,
                targetPath: '/invitations/received?invitationId=uuid-invite-999',
                createdAt: '2026-06-12T00:00:00Z',
              },
            ],
            meta: { count: 1, take: 20, next: null },
          },
        });
      }),
      http.post('*/invitations/uuid-invite-999/accept', () => {
        acceptApiCalled = true;
        return HttpResponse.json({
          success: true,
          data: {
            invitationId: 'uuid-invite-999',
            bandId: 'mock-joined-band-id',
            userId: 'user-123',
            invitationStatus: 'ACCEPTED',
            joinedAt: '2026-04-30T10:00:00.000Z',
          },
        });
      })
    );

    renderWithClient(<NotificationList tab="INVITE" />);

    const acceptBtn = await screen.findByRole('button', { name: '수락' });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(acceptApiCalled).toBe(true);
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/band/mock-joined-band-id' });
    });
  });
});

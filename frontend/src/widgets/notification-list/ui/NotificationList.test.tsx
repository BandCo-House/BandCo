import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_URL } from '@/mocks/config';
import { Toaster } from '@/shared/ui/sonner';
import { NotificationList } from './NotificationList';
import { NotificationHeaderActions } from './NotificationHeaderActions';

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
      http.get(`${API_URL}/notifications/me`, ({ request }) => {
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

  // 탭 관련 검증은 NotificationTabs.test.tsx로 옮겼다 — 탭이 헤더로 빠졌다.

  it('모두 읽음 버튼이 알약(캡슐) 모양으로 표시된다', async () => {
    server.use(
      http.get(`${API_URL}/notifications/me`, () => {
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
    expect(markAllBtn).toHaveClass('rounded-full', 'px-4', 'py-1.5');
  });

  it('초대장 알림에서 수락하면 목록에 남고, 토스트의 "밴드 둘러보기"로 밴드에 들어간다', async () => {
    let acceptApiCalled = false;

    server.use(
      http.get(`${API_URL}/notifications/me`, () => {
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
                targetPath:
                  '/invitations/received?invitationId=uuid-invite-999',
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
          status: 'success',
          error: null,
          message: '요청 성공',
          data: {
            invitationId: 'uuid-invite-999',
            bandId: 'mock-joined-band-id',
            userId: 'user-123',
            invitationStatus: 'ACCEPTED',
            joinedAt: '2026-04-30T10:00:00.000Z',
          },
        });
      }),
    );

    renderWithClient(
      <>
        <NotificationList tab="INVITE" />
        <Toaster />
      </>,
    );

    const acceptBtn = await screen.findByRole('button', { name: '수락' });
    fireEvent.click(acceptBtn);

    await waitFor(() => expect(acceptApiCalled).toBe(true));
    // 바로 밴드로 넘어가지 않는다. 카드가 "수락됨"으로 바뀌는 걸 볼 수 있어야 한다.
    expect(mockNavigate).not.toHaveBeenCalled();

    // 화면에 뜬 실제 토스트의 버튼을 누른다. 버튼이 안 뜨거나 눌리지 않으면 여기서 실패한다.
    expect(await screen.findByText('초대를 수락했습니다.')).toBeInTheDocument();
    fireEvent.click(
      await screen.findByRole('button', { name: '밴드 둘러보기' }),
    );

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/band/mock-joined-band-id',
    });
  });

  it('편집 모드의 전체 삭제는 확인을 거쳐 서버의 전체 삭제를 부른다', async () => {
    let deleteAllCalled = false;
    server.use(
      http.delete(`${API_URL}/notifications/all`, () => {
        deleteAllCalled = true;
        return HttpResponse.json({
          status: 'success',
          error: null,
          message: '전체 알림 삭제 성공',
          data: { deletedCount: 3 },
        });
      }),
    );

    renderWithClient(
      <>
        <NotificationHeaderActions />
        <NotificationList tab="NOTICE" />
      </>,
    );

    fireEvent.click(
      await screen.findByRole('button', { name: '편집 모드 활성화' }),
    );
    fireEvent.click(await screen.findByRole('button', { name: '전체 삭제' }));
    expect(deleteAllCalled).toBe(false);

    fireEvent.click(await screen.findByRole('button', { name: '모두 삭제' }));

    await waitFor(() => expect(deleteAllCalled).toBe(true));
  });
});

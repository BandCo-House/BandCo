import { http, HttpResponse } from 'msw';
import { API_URL } from '../config';

interface MockNotificationReference {
  type: 'BAND_INVITATION';
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  sender: {
    userId: string;
    nickname: string;
    avatarUrl: string | null;
  } | null;
}

interface MockNotification {
  notificationId: string;
  type: string;
  title: string;
  description: string;
  isRead: boolean;
  targetPath: string;
  reference: MockNotificationReference | null;
  createdAt: string;
}

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3600000).toISOString();

// 안 읽음은 최신 3건만 둔다. 예전엔 앞 15건만 읽음이라 "더 보기"를 누르면
// 그 뒤부터 전부 안 읽음(밝은 카드)으로 뚝 바뀌어 색이 갈라져 보였다.
const UNREAD_INVITE_COUNT = 3;

const inviteNotifications: MockNotification[] = Array.from(
  { length: 30 },
  (_, i) => {
    const invitationId = `uuid-invite-${i + 1}`;
    return {
      notificationId: invitationId,
      type: 'INVITE',
      title: '밴드 초대가 도착했습니다.',
      description: '새 밴드 초대가 도착했습니다.',
      isRead: i >= UNREAD_INVITE_COUNT,
      targetPath: `/invitations/received?invitationId=${invitationId}`,
      reference: {
        type: 'BAND_INVITATION',
        id: invitationId,
        status: 'PENDING',
        sender: {
          userId: `user-sender-${i + 1}`,
          nickname: `김민준${i + 1}`,
          avatarUrl: null,
        },
      },
      createdAt: hoursAgo(i),
    };
  },
);

const noticeNotifications: MockNotification[] = [
  {
    notificationId: 'uuid-notice-1',
    type: 'NOTICE',
    title: '새 공지사항이 등록되었습니다.',
    description: '이번 주 정기 합주 일정이 공지에 올라왔어요.',
    isRead: false,
    targetPath: '/band/band-1/notices',
    reference: null,
    createdAt: hoursAgo(2),
  },
];

const reminderNotifications: MockNotification[] = [
  {
    notificationId: 'uuid-reminder-1',
    type: 'REMINDER',
    title: '일정 조율 요청이 도착했습니다.',
    description: '금요일 합주 시간에 대한 응답을 기다리고 있어요.',
    isRead: false,
    targetPath: '/band/band-1',
    reference: null,
    createdAt: hoursAgo(1),
  },
  {
    notificationId: 'uuid-reminder-2',
    type: 'REMINDER',
    title: '내일 합주가 있어요.',
    description: '신촌 연습실 A · 오후 7시 시작이에요.',
    isRead: false,
    targetPath: '/band/band-1',
    reference: null,
    createdAt: hoursAgo(5),
  },
  {
    notificationId: 'uuid-reminder-3',
    type: 'REMINDER',
    title: '합주 일정이 변경되었습니다.',
    description: '토요일 합주가 오후 3시로 옮겨졌어요.',
    isRead: true,
    targetPath: '/band/band-1',
    reference: null,
    createdAt: hoursAgo(30),
  },
];

let mockNotifications: MockNotification[] = [
  ...noticeNotifications,
  ...reminderNotifications,
  ...inviteNotifications,
];

export const updateMockNotificationInviteStatus = (
  invitationId: string,
  status: 'ACCEPTED' | 'DECLINED',
) => {
  const target = mockNotifications.find(
    (n) =>
      n.reference?.id === invitationId || n.notificationId === invitationId,
  );
  if (target) {
    target.isRead = true;
    if (target.reference) {
      target.reference.status = status;
    }
  }
};

export const notificationHandlers = [
  http.get(`${API_URL}/notifications/me`, ({ request }) => {
    const url = new URL(request.url);
    const whereIsRead = url.searchParams.get('where__is_read');
    const whereType = url.searchParams.get('where__type');
    const take = Number(url.searchParams.get('take') || 20);
    const cursorId = url.searchParams.get('cursor__id');

    // 시드를 타입별로 이어 붙여 두었으므로 응답 직전에 최신순으로 정렬한다.
    let filtered = [...mockNotifications].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );

    if (whereType) {
      filtered = filtered.filter((n) => n.type === whereType);
    }

    if (whereIsRead === 'true') {
      filtered = filtered.filter((n) => n.isRead);
    } else if (whereIsRead === 'false') {
      filtered = filtered.filter((n) => !n.isRead);
    }

    // 커서 기반 페이징 로직 구현
    let startIndex = 0;
    if (cursorId) {
      const idx = filtered.findIndex((n) => n.notificationId === cursorId);
      if (idx !== -1) {
        startIndex = idx + 1; // 커서로 넘어온 ID 다음 원소부터 시작
      }
    }

    const sliced = filtered.slice(startIndex, startIndex + take);
    const nextItem = filtered[startIndex + take];
    const nextCursor = nextItem ? nextItem.notificationId : null;

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '알림 목록 조회 성공',
      data: {
        items: sliced,
        meta: {
          count: sliced.length,
          take: take,
          next: nextCursor
            ? `/notifications/me?cursor__id=${nextCursor}`
            : null,
        },
      },
    });
  }),
  http.delete(`${API_URL}/notifications`, async ({ request }) => {
    const body = (await request.json()) as { notificationIds: string[] };

    mockNotifications = mockNotifications.filter(
      (n) => !body.notificationIds.includes(n.notificationId),
    );

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '다건 알림 삭제 성공',
      data: {
        deletedCount: body.notificationIds.length,
        notificationIds: body.notificationIds,
      },
    });
  }),
  http.get(`${API_URL}/notifications/unread-summary`, () => {
    const unread = mockNotifications.filter((n) => !n.isRead);
    const unreadCount = unread.length;
    const inviteCount = unread.filter((n) => n.type === 'INVITE').length;
    const noticeCount = unread.filter((n) => n.type === 'NOTICE').length;
    const reminderCount = unread.filter((n) => n.type === 'REMINDER').length;

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '읽지 않은 알림 개수 조회 성공',
      data: {
        unreadCount: unreadCount,
        unreadByType: {
          NOTICE: noticeCount,
          INVITE: inviteCount,
          REMINDER: reminderCount,
        },
      },
    });
  }),
  http.patch(`${API_URL}/notifications/:notificationId/read`, ({ params }) => {
    const { notificationId } = params;
    const target = mockNotifications.find(
      (n) => n.notificationId === notificationId,
    );
    let updatedCount = 0;
    if (target) {
      if (!target.isRead) {
        target.isRead = true;
        updatedCount = 1;
      }
    }

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '알림 읽음 처리 성공',
      data: {
        notificationId: notificationId,
        updatedCount: updatedCount,
      },
    });
  }),
  http.patch(`${API_URL}/notifications/read-all`, () => {
    const unreadBefore = mockNotifications.filter((n) => !n.isRead).length;
    mockNotifications = mockNotifications.map((n) => ({
      ...n,
      isRead: true,
    }));

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '전체 알림 읽음 처리 성공',
      data: {
        updatedCount: unreadBefore,
      },
    });
  }),
];

import { http, HttpResponse } from 'msw';
import { API_URL } from '../config';

export const notificationHandlers = [
  http.get(`${API_URL}/notifications`, () => {
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '알림 목록 조회 성공',
      data: {
        items: [
          {
            notificationId: 'uuid-invite-1',
            type: 'INVITE',
            title: '밴드 초대가 도착했습니다.',
            description: '김민준님이 합주하자 밴드로 초대했습니다.',
            isRead: false,
            targetPath: '/invite/a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1',
            createdAt: '2026-03-05T10:00:00+09:00',
          },
          {
            notificationId: 'uuid-notice-1',
            type: 'NOTICE',
            title: '밴드 공지가 등록되었습니다.',
            description: '정기 공연 공지 내용을 확인해주세요.',
            isRead: true,
            targetPath:
              '/band/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/notices/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            createdAt: '2026-03-05T11:00:00+09:00',
          },
          {
            notificationId: 'uuid-reminder-1',
            type: 'REMINDER',
            title: '오늘 합주 일정이 있습니다.',
            description: '오후 7시 연습실 합주 일정을 확인해주세요.',
            isRead: false,
            targetPath:
              '/space/cccccccc-cccc-cccc-cccc-cccccccccccc/schedules/dddddddd-dddd-dddd-dddd-dddddddddddd',
            createdAt: '2026-03-05T12:00:00+09:00',
          },
        ],
        pagination: {
          page: 1,
          size: 20,
          totalCount: 3,
          hasNext: false,
        },
      },
    });
  }),
  http.get(`${API_URL}/notifications/unread-summary`, () => {
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '읽지 않은 알림 개수 조회 성공',
      data: {
        unreadCount: 3,
        unreadByType: {
          NOTICE: 1,
          INVITE: 1,
          REMINDER: 1,
        },
      },
    });
  }),
  http.patch(
    `${API_URL}/notifications/:notificationId/read`,
    ({ params }) => {
      return HttpResponse.json({
        status: 'success',
        error: null,
        message: '알림 읽음 처리 성공',
        data: {
          notificationId: params.notificationId,
          updatedCount: 1,
        },
      });
    },
  ),
  http.patch(`${API_URL}/notifications/read-all`, () => {
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '전체 알림 읽음 처리 성공',
      data: {
        updatedCount: 3,
      },
    });
  }),
];

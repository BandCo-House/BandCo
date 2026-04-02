import { http, HttpResponse } from 'msw';
import { API_URL } from '../config';

export const notificationHandlers = [
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

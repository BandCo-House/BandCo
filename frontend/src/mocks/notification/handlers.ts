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
];

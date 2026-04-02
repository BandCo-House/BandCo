import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/shared/api/client';
import { getNotificationUnreadSummary } from './notification-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('getNotificationUnreadSummary 어댑터', () => {
  it('GET /notifications/unread-summary 응답을 schema로 검증한 뒤 unread summary를 반환한다', async () => {
    mock.onGet('/notifications/unread-summary').reply(200, {
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

    await expect(getNotificationUnreadSummary()).resolves.toEqual({
      unreadCount: 3,
      unreadByType: {
        NOTICE: 1,
        INVITE: 1,
        REMINDER: 1,
      },
    });
  });

  it('필수 unreadByType 필드가 누락되면 reject된다', async () => {
    mock.onGet('/notifications/unread-summary').reply(200, {
      status: 'success',
      error: null,
      message: '읽지 않은 알림 개수 조회 성공',
      data: {
        unreadCount: 3,
        unreadByType: {
          NOTICE: 1,
          INVITE: 1,
        },
      },
    });

    await expect(getNotificationUnreadSummary()).rejects.toThrow();
  });

  it('network error가 발생하면 reject된다', async () => {
    mock.onGet('/notifications/unread-summary').networkError();

    await expect(getNotificationUnreadSummary()).rejects.toThrow();
  });

  it('500 응답이 오면 reject된다', async () => {
    mock.onGet('/notifications/unread-summary').reply(500);

    await expect(getNotificationUnreadSummary()).rejects.toThrow();
  });
});

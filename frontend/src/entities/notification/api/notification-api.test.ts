import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/shared/api/client';
import { getNotificationList, getNotificationUnreadSummary } from './notification-api';

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

describe('getNotificationList 어댑터', () => {
  it('GET /notifications 응답을 schema로 검증한 뒤 목록을 반환한다', async () => {
    mock.onGet('/notifications').reply(200, {
      status: 'success',
      error: null,
      message: '알림 목록 조회 성공',
      data: {
        items: [
          {
            notificationId: 'uuid-1',
            type: 'INVITE',
            title: '밴드 초대가 도착했습니다.',
            description: '김민준님이 합주하자 밴드로 초대했습니다.',
            isRead: false,
            targetPath: '/invite/a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1',
            createdAt: '2026-03-05T10:00:00+09:00',
          },
        ],
        pagination: {
          page: 1,
          size: 20,
          totalCount: 1,
          hasNext: false,
        },
      },
    });

    await expect(getNotificationList()).resolves.toEqual({
      items: [
        {
          notificationId: 'uuid-1',
          type: 'INVITE',
          title: '밴드 초대가 도착했습니다.',
          description: '김민준님이 합주하자 밴드로 초대했습니다.',
          isRead: false,
          targetPath: '/invite/a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1',
          createdAt: '2026-03-05T10:00:00+09:00',
        },
      ],
      pagination: {
        page: 1,
        size: 20,
        totalCount: 1,
        hasNext: false,
      },
    });
  });

  it('필수 pagination 필드가 누락되면 reject된다', async () => {
    mock.onGet('/notifications').reply(200, {
      status: 'success',
      error: null,
      message: '알림 목록 조회 성공',
      data: {
        items: [],
      },
    });

    await expect(getNotificationList()).rejects.toThrow();
  });
});

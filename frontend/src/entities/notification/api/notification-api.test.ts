import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/shared/api';
import {
  getNotificationList,
  getNotificationUnreadSummary,
  deleteManyNotifications,
} from './notification-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('getNotificationUnreadSummary 어댑터', () => {
  it('GET /notifications/unread-summary 응답을 schema로 검증해 전체·타입별 개수를 반환한다', async () => {
    mock.onGet('/notifications/unread-summary').reply(200, {
      status: 'success',
      error: null,
      message: '읽지 않은 알림 개수 조회 성공',
      data: {
        unreadCount: 4,
        unreadByType: { NOTICE: 1, INVITE: 2, REMINDER: 1 },
      },
    });

    await expect(getNotificationUnreadSummary()).resolves.toEqual({
      unreadCount: 4,
      unreadByType: { NOTICE: 1, INVITE: 2, REMINDER: 1 },
    });
  });

  it('타입 카운트가 누락되면 reject된다', async () => {
    mock.onGet('/notifications/unread-summary').reply(200, {
      status: 'success',
      error: null,
      message: '읽지 않은 알림 개수 조회 성공',
      data: {
        unreadCount: 1,
        unreadByType: { INVITE: 1 },
      },
    });

    await expect(getNotificationUnreadSummary()).rejects.toThrow();
  });
});

describe('getNotificationList 어댑터', () => {
  it('GET /notifications/me 응답을 schema로 검증한 뒤 목록을 반환한다', async () => {
    mock.onGet('/notifications/me').reply(200, {
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
        meta: {
          count: 1,
          take: 20,
          next: null,
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
      meta: {
        count: 1,
        take: 20,
        next: null,
      },
    });
  });

  it('필수 meta 필드가 누락되면 reject된다', async () => {
    mock.onGet('/notifications/me').reply(200, {
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

describe('deleteManyNotifications 어댑터', () => {
  it('DELETE /notifications 요청을 정상 payload와 함께 전송하고 성공적으로 마무리된다', async () => {
    mock
      .onDelete('/notifications', {
        data: { notificationIds: ['id-1', 'id-2'] },
      })
      .reply(200, {
        status: 'success',
        error: null,
        message: '삭제 성공',
        data: {
          deletedCount: 2,
          notificationIds: ['id-1', 'id-2'],
        },
      });

    await expect(
      deleteManyNotifications(['id-1', 'id-2']),
    ).resolves.toBeUndefined();
  });
});

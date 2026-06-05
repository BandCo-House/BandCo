import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { apiClient } from '@/shared/api/client';
import {
  getNotificationList,
  getUnreadNotificationBadge,
  deleteManyNotifications,
} from './notification-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('getUnreadNotificationBadge 어댑터', () => {
  it('GET /notifications/me?where__is_read=false&take=10 요청을 하여 10개 미만일 때 개수를 반환한다', async () => {
    mock
      .onGet('/notifications/me', {
        params: { where__is_read: false, take: 10 },
      })
      .reply(200, {
        status: 'success',
        error: null,
        message: '성공',
        data: {
          items: Array.from({ length: 5 }, (_, i) => ({
            notificationId: `uuid-${i}`,
            type: 'INVITE',
            title: '초대',
            description: '설명',
            isRead: false,
            targetPath: '',
            createdAt: '',
          })),
          meta: { count: 5, take: 10, next: null },
        },
      });

    await expect(getUnreadNotificationBadge()).resolves.toEqual({
      count: 5,
      hasMore: false,
    });
  });

  it('10개 이상 데이터가 있어 next 필드가 존재하면 hasMore를 true로 반환한다', async () => {
    mock
      .onGet('/notifications/me', {
        params: { where__is_read: false, take: 10 },
      })
      .reply(200, {
        status: 'success',
        error: null,
        message: '성공',
        data: {
          items: Array.from({ length: 10 }, (_, i) => ({
            notificationId: `uuid-${i}`,
            type: 'INVITE',
            title: '초대',
            description: '설명',
            isRead: false,
            targetPath: '',
            createdAt: '',
          })),
          meta: {
            count: 10,
            take: 10,
            next: '/notifications/me?cursor__id=some-id',
          },
        },
      });

    await expect(getUnreadNotificationBadge()).resolves.toEqual({
      count: 10,
      hasMore: true,
    });
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
    mock.onDelete('/notifications', { data: { notificationIds: ['id-1', 'id-2'] } }).reply(200, {
      status: 'success',
      error: null,
      message: '삭제 성공',
      data: {
        deletedCount: 2,
        notificationIds: ['id-1', 'id-2'],
      },
    });

    await expect(deleteManyNotifications(['id-1', 'id-2'])).resolves.toBeUndefined();
  });
});

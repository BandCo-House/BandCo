import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import type { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationsService } from './notifications.service';

test('알림 목록 조회 서비스는 임시 사용자 기준으로 repository 조회를 위임한다', async () => {
  let capturedUserId: string | undefined;

  const repository: NotificationsRepository = {
    async findNotifications(userId, query) {
      capturedUserId = userId;

      return {
        items: [
          {
            notificationId: 'notification-001',
            type: 'INVITE',
            title: '밴드 초대가 도착했습니다.',
            description: '김민준님이 합주하자 밴드로 초대했습니다.',
            isRead: false,
            targetPath: '/invites/notification-001',
            createdAt: '2026-03-05T10:00:00.000Z',
          },
        ],
        pagination: {
          page: query.page,
          size: query.size,
          totalCount: 1,
          hasNext: false,
        },
      };
    },
    async countUnreadNotifications() {
      return {
        unreadCount: 3,
        unreadByType: {
          INVITE: 1,
          NOTICE: 1,
          REMINDER: 1,
        },
      };
    },
    async markNotificationAsRead() {
      return {
        notificationId: 'notification-001',
        isRead: true,
      };
    },
  };
  const service = new NotificationsService(repository);

  const result = await service.getNotifications({
    isRead: false,
    type: 'INVITE',
    from: undefined,
    to: undefined,
    page: 1,
    size: 20,
    sort: 'createdAt,desc',
  });

  assert.equal(capturedUserId, '11111111-1111-1111-1111-111111111111');
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.type, 'INVITE');
  assert.equal(result.pagination.totalCount, 1);
});

test('안읽음 알림 개수 조회 서비스는 임시 사용자 기준으로 repository 조회를 위임한다', async () => {
  let capturedUserId: string | undefined;

  const repository: NotificationsRepository = {
    async findNotifications() {
      return {
        items: [],
        pagination: {
          page: 1,
          size: 20,
          totalCount: 0,
          hasNext: false,
        },
      };
    },
    async countUnreadNotifications(userId) {
      capturedUserId = userId;

      return {
        unreadCount: 3,
        unreadByType: {
          INVITE: 1,
          NOTICE: 1,
          REMINDER: 1,
        },
      };
    },
    async markNotificationAsRead() {
      return {
        notificationId: 'notification-001',
        isRead: true,
      };
    },
  };
  const service = new NotificationsService(repository);

  const result = await service.getUnreadNotificationCount();

  assert.equal(capturedUserId, '11111111-1111-1111-1111-111111111111');
  assert.equal(result.unreadCount, 3);
  assert.equal(result.unreadByType.INVITE, 1);
  assert.equal(result.unreadByType.NOTICE, 1);
  assert.equal(result.unreadByType.REMINDER, 1);
});

test('알림 목록 조회 서비스는 from이 to보다 늦으면 예외를 던진다', async () => {
  const repository: NotificationsRepository = {
    async findNotifications() {
      return {
        items: [],
        pagination: {
          page: 1,
          size: 20,
          totalCount: 0,
          hasNext: false,
        },
      };
    },
    async countUnreadNotifications() {
      return {
        unreadCount: 0,
        unreadByType: {
          INVITE: 0,
          NOTICE: 0,
          REMINDER: 0,
        },
      };
    },
    async markNotificationAsRead() {
      return {
        notificationId: 'notification-001',
        isRead: true,
      };
    },
  };
  const service = new NotificationsService(repository);

  await assert.rejects(async () => {
    await service.getNotifications({
      isRead: undefined,
      type: undefined,
      from: new Date('2026-03-06T00:00:00.000Z'),
      to: new Date('2026-03-05T00:00:00.000Z'),
      page: 1,
      size: 20,
      sort: undefined,
    });
  }, BadRequestException);
});

test('알림 읽음 처리 서비스는 임시 사용자 기준으로 repository에 읽음 처리를 위임한다', async () => {
  let capturedUserId: string | undefined;
  let capturedNotificationId: string | undefined;

  const repository: NotificationsRepository = {
    async findNotifications() {
      return {
        items: [],
        pagination: {
          page: 1,
          size: 20,
          totalCount: 0,
          hasNext: false,
        },
      };
    },
    async countUnreadNotifications() {
      return {
        unreadCount: 3,
        unreadByType: {
          INVITE: 1,
          NOTICE: 1,
          REMINDER: 1,
        },
      };
    },
    async markNotificationAsRead(userId, notificationId) {
      capturedUserId = userId;
      capturedNotificationId = notificationId;

      return {
        notificationId,
        isRead: true,
      };
    },
  };
  const service = new NotificationsService(repository);

  const result = await service.markNotificationAsRead('notification-001');

  assert.equal(capturedUserId, '11111111-1111-1111-1111-111111111111');
  assert.equal(capturedNotificationId, 'notification-001');
  assert.equal(result.notificationId, 'notification-001');
  assert.equal(result.isRead, true);
});

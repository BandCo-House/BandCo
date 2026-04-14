import assert from 'node:assert/strict';

import test from 'node:test';

import type { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

test('알림 목록 조회 컨트롤러는 공통 성공 응답 형식을 반환한다', async () => {
  const repository: NotificationsRepository = {
    async findNotifications() {
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
          page: 1,
          size: 20,
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
  const controller = new NotificationsController(service);

  const response = await controller.getNotifications({
    page: 1,
    size: 20,
  });

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '알림 목록 조회 성공');
  assert.equal(response.data.items.length, 1);
  assert.equal(response.data.items[0]?.notificationId, 'notification-001');
  assert.equal(response.data.pagination.totalCount, 1);
});

test('안읽음 알림 개수 조회 컨트롤러는 공통 성공 응답 형식을 반환한다', async () => {
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
    async markNotificationAsRead() {
      return {
        notificationId: 'notification-001',
        isRead: true,
      };
    },
  };
  const service = new NotificationsService(repository);
  const controller = new NotificationsController(service);

  const response = await controller.getUnreadNotificationCount();

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '읽지 않은 알림 개수 조회 성공');
  assert.equal(response.data.unreadCount, 3);
  assert.equal(response.data.unreadByType.INVITE, 1);
  assert.equal(response.data.unreadByType.NOTICE, 1);
  assert.equal(response.data.unreadByType.REMINDER, 1);
});

test('알림 읽음 처리 컨트롤러는 공통 성공 응답 형식을 반환한다', async () => {
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
    async markNotificationAsRead(notificationUserId, notificationId) {
      assert.equal(notificationUserId, '11111111-1111-1111-1111-111111111111');

      return {
        notificationId,
        isRead: true,
      };
    },
  };
  const service = new NotificationsService(repository);
  const controller = new NotificationsController(service);

  const response = await controller.markNotificationAsRead('notification-001');

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '알림 읽음 처리 성공');
  assert.equal(response.data.notificationId, 'notification-001');
  assert.equal(response.data.isRead, true);
});

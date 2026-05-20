import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import type { GetNotificationsQuery } from './dto/get-notifications-query.dto';
import type { NotificationsRepository } from './repositories/notifications.repository';
import { NOTIFICATIONS_REPOSITORY } from './repositories/notifications.repository';
import type { DeleteManyNotificationsResult } from './types/delete-many-notifications-result.type';
import type { DeleteNotificationResult } from './types/delete-notification-result.type';
import type { MarkAllReadResult } from './types/mark-all-read-result.type';
import type { MarkManyReadResult } from './types/mark-many-read-result.type';
import type { MarkNotificationReadResult } from './types/mark-notification-read-result.type';
import type { GetNotificationsResult } from './types/notification-list-item.type';
import { NotificationsService } from './notifications.service';

const mockListResult: GetNotificationsResult = {
  items: [
    {
      notificationId: 'noti-001',
      type: 'INVITE',
      title: '밴드 초대',
      description: '초대가 도착했습니다.',
      isRead: false,
      targetPath: '/invites/noti-001',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  meta: { count: 1, take: 20, next: null },
};

const mockReadResult: MarkNotificationReadResult = {
  notificationId: 'noti-001',
  type: 'INVITE',
  title: '밴드 초대',
  description: '초대가 도착했습니다.',
  isRead: true,
  targetPath: '/invites/noti-001',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockAllReadResult: MarkAllReadResult = { updatedCount: 3 };
const mockManyReadResult: MarkManyReadResult = { updatedCount: 2, notificationIds: ['noti-001', 'noti-002'] };
const mockDeleteResult: DeleteNotificationResult = { notificationId: 'noti-001' };
const mockDeleteManyResult: DeleteManyNotificationsResult = { deletedCount: 2, notificationIds: ['noti-001', 'noti-002'] };

const repositoryStub: NotificationsRepository = {
  async findNotifications() {
    return mockListResult;
  },
  async markAllNotificationsAsRead() {
    return mockAllReadResult;
  },
  async markManyNotificationsAsRead() {
    return mockManyReadResult;
  },
  async markNotificationAsRead(_userId, notificationId) {
    return notificationId === 'noti-001' ? mockReadResult : undefined;
  },
  async deleteNotification(_userId, notificationId) {
    return notificationId === 'noti-001' ? mockDeleteResult : undefined;
  },
  async deleteManyNotifications() {
    return mockDeleteManyResult;
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationsService, { provide: NOTIFICATIONS_REPOSITORY, useValue: repositoryStub }],
    }).compile();

    service = module.get(NotificationsService);
  });

  describe('getNotifications', () => {
    it('repository 결과를 그대로 반환한다', async () => {
      const query: GetNotificationsQuery = { order__created_at: 'desc', order__id: 'desc', take: 20 };
      const result = await service.getNotifications('user-001', query);
      expect(result.items).toHaveLength(1);
      expect(result.meta.next).toBeNull();
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('repository 결과를 그대로 반환한다', async () => {
      const result = await service.markAllNotificationsAsRead('user-001');
      expect(result.updatedCount).toBe(3);
    });
  });

  describe('markManyNotificationsAsRead', () => {
    it('repository 결과를 그대로 반환한다', async () => {
      const result = await service.markManyNotificationsAsRead('user-001', ['noti-001', 'noti-002']);
      expect(result.updatedCount).toBe(2);
      expect(result.notificationIds).toEqual(['noti-001', 'noti-002']);
    });
  });

  describe('markNotificationAsRead', () => {
    it('알림이 존재하면 읽음 처리 결과를 반환한다', async () => {
      const result = await service.markNotificationAsRead('user-001', 'noti-001');
      expect(result.notificationId).toBe('noti-001');
      expect(result.isRead).toBe(true);
    });

    it('알림이 존재하지 않으면 NotFoundException을 던진다', async () => {
      await expect(service.markNotificationAsRead('user-001', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteNotification', () => {
    it('알림이 존재하면 삭제 결과를 반환한다', async () => {
      const result = await service.deleteNotification('user-001', 'noti-001');
      expect(result.notificationId).toBe('noti-001');
    });

    it('알림이 존재하지 않으면 NotFoundException을 던진다', async () => {
      await expect(service.deleteNotification('user-001', 'unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteManyNotifications', () => {
    it('repository 결과를 그대로 반환한다', async () => {
      const result = await service.deleteManyNotifications('user-001', ['noti-001', 'noti-002']);
      expect(result.deletedCount).toBe(2);
      expect(result.notificationIds).toEqual(['noti-001', 'noti-002']);
    });
  });
});

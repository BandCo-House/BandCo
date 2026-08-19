import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';

import { NotificationsPrismaRepository } from './notifications.prisma-repository';

const mockNotification = {
  id: 'noti-001',
  type: 'INVITE' as const,
  title: '밴드 초대',
  description: '초대가 도착했습니다.',
  isRead: false,
  targetPath: '/invites/noti-001',
  referenceType: null,
  referenceId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockPrisma = {
  notification: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  bandInvitation: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('NotificationsPrismaRepository', () => {
  let repository: NotificationsPrismaRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationsPrismaRepository, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    repository = module.get(NotificationsPrismaRepository);
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation((fn: (tx: typeof mockPrisma) => unknown) => fn(mockPrisma));
  });

  describe('findUnreadSummary', () => {
    it('타입별 미읽음 개수와 전체 개수를 반환한다', async () => {
      mockPrisma.notification.groupBy.mockResolvedValue([
        { type: 'INVITE', _count: { _all: 2 } },
        { type: 'NOTICE', _count: { _all: 3 } },
      ]);

      const result = await repository.findUnreadSummary('user-001');

      expect(mockPrisma.notification.groupBy).toHaveBeenCalledWith({
        by: ['type'],
        where: { userId: 'user-001', isRead: false },
        _count: { _all: true },
      });
      expect(result).toEqual({
        unreadCount: 5,
        unreadByType: { INVITE: 2, NOTICE: 3, REMINDER: 0 },
      });
    });

    it('읽지 않은 알림이 없으면 모든 개수를 0으로 반환한다', async () => {
      mockPrisma.notification.groupBy.mockResolvedValue([]);

      await expect(repository.findUnreadSummary('user-001')).resolves.toEqual({
        unreadCount: 0,
        unreadByType: { INVITE: 0, NOTICE: 0, REMINDER: 0 },
      });
    });
  });

  describe('findNotifications', () => {
    it('필터 없이 전체 조회한다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);

      const result = await repository.findNotifications('user-001', { order__created_at: 'desc', order__id: 'desc', take: 20 });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-001', isRead: undefined, type: undefined } }),
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.notificationId).toBe('noti-001');
    });

    it('BAND_INVITATION 참조 알림에 발신자와 현재 상태를 채운다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ ...mockNotification, referenceType: 'BAND_INVITATION', referenceId: 'inv-001' }]);
      mockPrisma.bandInvitation.findMany.mockResolvedValue([
        {
          id: 'inv-001',
          status: 'PENDING',
          inviterBandMember: { user: { id: 'user-inviter', profile: { nickname: '준혁', avatarUrl: null } } },
        },
      ]);

      const result = await repository.findNotifications('user-001', { order__created_at: 'desc', order__id: 'desc', take: 20 });

      expect(result.items[0]?.reference).toEqual({
        type: 'BAND_INVITATION',
        id: 'inv-001',
        status: 'PENDING',
        sender: { userId: 'user-inviter', nickname: '준혁', avatarUrl: null },
      });
    });

    it('참조가 없는 알림의 reference는 null이다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);

      const result = await repository.findNotifications('user-001', { order__created_at: 'desc', order__id: 'desc', take: 20 });

      expect(result.items[0]?.reference).toBeNull();
      expect(mockPrisma.bandInvitation.findMany).not.toHaveBeenCalled();
    });

    it('where__is_read 필터를 적용한다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await repository.findNotifications('user-001', { order__created_at: 'desc', order__id: 'desc', take: 20, where__is_read: false });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ isRead: false }) }));
    });

    it('where__type 필터를 적용한다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await repository.findNotifications('user-001', { order__created_at: 'desc', order__id: 'desc', take: 20, where__type: 'INVITE' });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ type: 'INVITE' }) }));
    });

    it('cursor__id가 있으면 cursor와 skip: 1을 적용한다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await repository.findNotifications('user-001', {
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
        cursor__id: 'noti-001',
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'noti-001' }, skip: 1 }));
    });

    it('count < take이면 meta.next가 null이다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);

      const result = await repository.findNotifications('user-001', { order__created_at: 'desc', order__id: 'desc', take: 20 });

      expect(result.meta.count).toBe(1);
      expect(result.meta.next).toBeNull();
    });

    it('다음 페이지가 있으면 meta.next에 URL을 반환한다', async () => {
      // take + 1개를 반환해야 hasNext가 true가 됨
      const notifications = Array.from({ length: 21 }, (_, i) => ({
        ...mockNotification,
        id: `noti-${String(i).padStart(3, '0')}`,
        createdAt: new Date(`2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`),
      }));
      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await repository.findNotifications('user-001', { order__created_at: 'desc', order__id: 'desc', take: 20 });

      expect(result.meta.count).toBe(20);
      expect(result.meta.next).toContain('/notifications/me?');
      expect(result.meta.next).toContain('cursor__id=noti-019');
      expect(result.meta.next).toContain('order__created_at=desc');
    });

    it('결과가 없으면 meta.next가 null이다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      const result = await repository.findNotifications('user-001', { order__created_at: 'desc', order__id: 'desc', take: 20 });

      expect(result.meta.next).toBeNull();
      expect(result.items).toHaveLength(0);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('읽지 않은 알림을 모두 읽음 처리하고 updatedCount를 반환한다', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await repository.markAllNotificationsAsRead('user-001');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-001', isRead: false },
        data: { isRead: true },
      });
      expect(result.updatedCount).toBe(5);
    });

    it('읽지 않은 알림이 없으면 updatedCount가 0이다', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.markAllNotificationsAsRead('user-001');

      expect(result.updatedCount).toBe(0);
    });
  });

  describe('markManyNotificationsAsRead', () => {
    it('실제 존재하는 읽지 않은 ID만 처리하고 결과를 반환한다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ id: 'noti-001' }, { id: 'noti-002' }]);
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 });

      const result = await repository.markManyNotificationsAsRead('user-001', ['noti-001', 'noti-002', 'noti-999']);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-001', id: { in: ['noti-001', 'noti-002', 'noti-999'] }, isRead: false } }),
      );
      expect(result.updatedCount).toBe(2);
      expect(result.notificationIds).toEqual(['noti-001', 'noti-002']);
    });

    it('해당 알림이 없으면 updatedCount가 0이다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

      const result = await repository.markManyNotificationsAsRead('user-001', ['noti-999']);

      expect(result.updatedCount).toBe(0);
      expect(result.notificationIds).toEqual([]);
    });
  });

  describe('markNotificationAsRead', () => {
    it('알림이 존재하면 읽음 처리 후 전체 필드를 반환한다', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({ id: 'noti-001' });
      mockPrisma.notification.update.mockResolvedValue({ ...mockNotification, isRead: true });

      const result = await repository.markNotificationAsRead('user-001', 'noti-001');

      expect(result).not.toBeUndefined();
      expect(result?.notificationId).toBe('noti-001');
      expect(result?.isRead).toBe(true);
      expect(result?.type).toBe('INVITE');
      expect(result?.title).toBe('밴드 초대');
    });

    it('알림이 존재하지 않으면 undefined를 반환한다', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      const result = await repository.markNotificationAsRead('user-001', 'unknown');

      expect(result).toBeUndefined();
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteNotification', () => {
    it('알림이 존재하면 삭제 후 notificationId를 반환한다', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue({ id: 'noti-001' });
      mockPrisma.notification.delete.mockResolvedValue(undefined);

      const result = await repository.deleteNotification('user-001', 'noti-001');

      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'noti-001' } });
      expect(result).toEqual({ notificationId: 'noti-001' });
    });

    it('알림이 존재하지 않으면 undefined를 반환한다', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      const result = await repository.deleteNotification('user-001', 'unknown');

      expect(result).toBeUndefined();
      expect(mockPrisma.notification.delete).not.toHaveBeenCalled();
    });
  });

  describe('deleteManyNotifications', () => {
    it('실제 존재하는 ID만 삭제하고 결과를 반환한다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ id: 'noti-001' }, { id: 'noti-002' }]);
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 2 });

      const result = await repository.deleteManyNotifications('user-001', ['noti-001', 'noti-002', 'noti-999']);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-001', id: { in: ['noti-001', 'noti-002', 'noti-999'] } } }),
      );
      expect(mockPrisma.notification.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['noti-001', 'noti-002'] } } });
      expect(result.deletedCount).toBe(2);
      expect(result.notificationIds).toEqual(['noti-001', 'noti-002']);
    });

    it('해당 알림이 없으면 deletedCount가 0이다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repository.deleteManyNotifications('user-001', ['noti-999']);

      expect(result.deletedCount).toBe(0);
      expect(result.notificationIds).toEqual([]);
    });
  });
});

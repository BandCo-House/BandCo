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
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockPrisma = {
  notification: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

describe('NotificationsPrismaRepository', () => {
  let repository: NotificationsPrismaRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationsPrismaRepository, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    repository = module.get(NotificationsPrismaRepository);
    jest.clearAllMocks();
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
        cursor__created_at: '2026-01-01T00:00:00.000Z',
      });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'noti-001' }, skip: 1 }));
    });

    it('count < take이면 meta.next가 null이다', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([mockNotification]);

      const result = await repository.findNotifications('user-001', { order__created_at: 'desc', order__id: 'desc', take: 20 });

      expect(result.meta.count).toBe(1);
      expect(result.meta.next).toBeNull();
    });

    it('count === take이면 meta.next에 다음 페이지 URL을 반환한다', async () => {
      const notifications = Array.from({ length: 20 }, (_, i) => ({
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
});

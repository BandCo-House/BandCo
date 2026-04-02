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
  };
  const service = new NotificationsService(repository);
  const controller = new NotificationsController(service);

  const response = await controller.getNotifications({
    page: '1',
    size: '20',
  });

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '알림 목록 조회 성공');
  assert.equal(response.data.items.length, 1);
  assert.equal(response.data.items[0]?.notificationId, 'notification-001');
  assert.equal(response.data.pagination.totalCount, 1);
});

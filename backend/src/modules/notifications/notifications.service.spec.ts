import assert from 'node:assert/strict';

import test from 'node:test';

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

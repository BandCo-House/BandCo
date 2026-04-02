import assert from 'node:assert/strict';

import test from 'node:test';

import { parseGetNotificationsQuery } from './get-notifications-query.dto';

test('알림 목록 조회 쿼리 파서는 유효한 필터와 페이지 정보를 정리한다', () => {
  const result = parseGetNotificationsQuery({
    isRead: 'false',
    type: 'INVITE',
    from: '2026-03-05T00:00:00.000Z',
    to: '2026-03-06T00:00:00.000Z',
    page: '2',
    size: '10',
    sort: 'createdAt,asc',
  });

  assert.equal(result.isRead, false);
  assert.equal(result.type, 'INVITE');
  assert.equal(result.from?.toISOString(), '2026-03-05T00:00:00.000Z');
  assert.equal(result.to?.toISOString(), '2026-03-06T00:00:00.000Z');
  assert.equal(result.page, 2);
  assert.equal(result.size, 10);
  assert.equal(result.sort, 'createdAt,asc');
});

test('알림 목록 조회 쿼리 파서는 허용되지 않은 타입이면 예외를 던진다', () => {
  assert.throws(() => {
    parseGetNotificationsQuery({
      type: 'WARNING',
    });
  });
});

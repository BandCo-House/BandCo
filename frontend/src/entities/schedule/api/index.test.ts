import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getSchedules } from './index';

const mock = new MockAdapter(apiClient);

const emptyResult = {
  success: true,
  data: { items: [], meta: { count: 0, take: 50, cursor: null, next: null } },
};

afterEach(() => {
  mock.reset();
});

describe('getSchedules 어댑터', () => {
  it('bandspaces 경로로 조회하고 날짜/유형 필터를 백엔드 쿼리 키로 변환한다', async () => {
    mock.onGet('/bandspaces/space-1/schedules').reply(200, emptyResult);

    await getSchedules('space-1', {
      from: '2026-03-17T00:00:00.000Z',
      to: '2026-03-18T23:59:59.999Z',
      scheduleType: 'PRACTICE',
    });

    const params = mock.history.get[0]?.params as Record<string, string>;
    expect(mock.history.get[0]?.url).toBe('/bandspaces/space-1/schedules');
    expect(params).toEqual({
      where__start_at__greater_than_equal: '2026-03-17T00:00:00.000Z',
      where__start_at__less_than_equal: '2026-03-18T23:59:59.999Z',
      where__schedule_type: 'PRACTICE',
    });
  });

  it('유형 미지정(전체) 시 schedule_type 파라미터를 보내지 않는다', async () => {
    mock.onGet('/bandspaces/space-1/schedules').reply(200, emptyResult);

    await getSchedules('space-1', {
      from: '2026-03-17T00:00:00.000Z',
      to: '2026-03-17T23:59:59.999Z',
    });

    const params = mock.history.get[0]?.params as Record<string, string>;
    expect(params).not.toHaveProperty('where__schedule_type');
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getSpace } from './space-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('space get 어댑터', () => {
  it('공연 공간 단건을 조회한다', async () => {
    mock.onGet('/spaces/space-1').reply(200, {
      success: true,
      data: {
        id: 'space-1',
        bandId: 'band-1',
        name: '2026 하계공연 무대',
        description: '여름 축제 공연 준비',
        spaceType: 'PERFORMANCE_PREP',
        eventDate: '2026-08-20',
      },
    });

    const result = await getSpace('space-1');

    expect(result.spaceType).toBe('PERFORMANCE_PREP');
  });
});

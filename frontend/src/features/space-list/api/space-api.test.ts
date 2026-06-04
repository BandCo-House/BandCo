import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getBandSpaces } from './space-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('space list 어댑터', () => {
  it('밴드 공연 공간 목록을 조회한다', async () => {
    mock
      .onGet('/bands/band-1/spaces', { params: { query: '하계공연', page: 1 } })
      .reply(200, {
        success: true,
        data: [
          {
            id: 'space-1',
            bandId: 'band-1',
            name: '2026 하계공연 무대',
            description: '여름 축제 공연 준비',
            spaceType: 'PERFORMANCE_PREP',
            eventDate: '2026-08-20',
          },
        ],
      });

    const result = await getBandSpaces('band-1', { query: '하계공연', page: 1 });

    expect(result[0]?.name).toBe('2026 하계공연 무대');
  });
});

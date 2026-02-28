import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { createSpace } from './space-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('space create 어댑터', () => {
  it('공연 공간을 생성한다', async () => {
    const requestBody = {
      name: '신규 공연 공간',
      description: '설명',
      spaceType: 'PRACTICE' as const,
      eventDate: null,
    };

    mock.onPost('/bands/band-1/spaces', requestBody).reply(200, {
      success: true,
      data: {
        id: 'space-2',
        bandId: 'band-1',
        name: '신규 공연 공간',
        description: '설명',
        spaceType: 'PRACTICE',
        eventDate: null,
      },
    });

    const result = await createSpace('band-1', requestBody);

    expect(result.name).toBe('신규 공연 공간');
  });
});

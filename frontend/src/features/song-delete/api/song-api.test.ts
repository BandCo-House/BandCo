import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { deleteSong } from './song-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('song delete 어댑터', () => {
  it('곡을 삭제한다', async () => {
    mock.onDelete('/songs/song-1').reply(200, {
      success: true,
      data: undefined,
    });

    await expect(deleteSong('song-1')).resolves.toBeUndefined();
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getSongTeams } from './song-team-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('song team list 어댑터', () => {
  it('특정 곡의 팀 목록을 조회한다', async () => {
    mock.onGet('/songs/teams/song-1', { params: { page: 1, size: 10 } }).reply(200, {
      success: true,
      data: [
        {
          id: 'team-1',
          songId: 'song-1',
          name: '듀얼 기타 편성',
          memberCount: 5,
        },
      ],
    });

    const result = await getSongTeams('song-1', { page: 1, size: 10 });

    expect(result[0]?.name).toBe('듀얼 기타 편성');
  });
});

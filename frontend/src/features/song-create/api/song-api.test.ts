import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { createSong } from './song-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('song create 어댑터', () => {
  it('곡을 생성한다', async () => {
    const requestBody = {
      title: '새 곡',
      artistName: 'NewJeans',
      sourceUrl: 'https://spotify.com/demo',
    };

    mock.onPost('/songs/band-1', requestBody).reply(200, {
      success: true,
      data: {
        id: 'song-2',
        bandId: 'band-1',
        title: '새 곡',
        artistName: 'NewJeans',
        key: '',
        bpm: null,
        duration: '',
        sourceUrl: 'https://spotify.com/demo',
        sourceType: null,
        referenceLinks: [],
        sessionNames: [],
        teamName: null,
        participantMemberIds: [],
        memo: '',
        status: 'ACTIVE',
      },
    });

    const result = await createSong('band-1', requestBody);

    expect(result.title).toBe('새 곡');
  });
});

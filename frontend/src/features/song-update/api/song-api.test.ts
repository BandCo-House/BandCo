import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { updateSong } from './song-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('song update 어댑터', () => {
  it('곡을 수정한다', async () => {
    const requestBody = {
      memo: '수정된 메모',
      status: 'ARCHIVED',
    };

    mock.onPatch('/songs/song-1', requestBody).reply(200, {
      success: true,
      data: {
        id: 'song-1',
        bandId: 'band-1',
        title: '좋은 날',
        artistName: 'IU',
        key: 'A 장조',
        bpm: 128,
        duration: '4:20',
        sourceUrl: null,
        sourceType: null,
        referenceLinks: [],
        sessionNames: ['보컬1'],
        teamName: null,
        participantMemberIds: [],
        memo: '수정된 메모',
        status: 'ARCHIVED',
      },
    });

    const result = await updateSong('song-1', requestBody);

    expect(result.memo).toBe('수정된 메모');
    expect(result.status).toBe('ARCHIVED');
  });
});

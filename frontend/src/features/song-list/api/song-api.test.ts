import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getSongs } from './song-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('song list 어댑터', () => {
  it('곡 목록을 조회한다', async () => {
    mock
      .onGet('/songs/band-1', { params: { query: '좋은 날', page: 1 } })
      .reply(200, {
        success: true,
        data: [
          {
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
            sessionNames: ['보컬1', '일렉기타'],
            teamName: '듀얼 기타 편성',
            participantMemberIds: ['member-1'],
            memo: '',
            status: 'ACTIVE',
          },
        ],
      });

    const result = await getSongs('band-1', { query: '좋은 날', page: 1 });

    expect(result[0]?.title).toBe('좋은 날');
  });
});

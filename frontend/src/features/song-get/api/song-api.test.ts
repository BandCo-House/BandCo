import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getSong } from './song-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('song get 어댑터', () => {
  it('곡 단건을 조회한다', async () => {
    mock.onGet('/songs/song-1').reply(200, {
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
        referenceLinks: [
          { label: 'YouTube', url: 'https://youtube.com/watch?v=demo' },
        ],
        sessionNames: ['보컬1', '일렉기타'],
        teamName: '듀얼 기타 편성',
        participantMemberIds: ['member-1', 'member-2'],
        memo: '첫 절은 어쿠스틱하게 시작',
        status: 'ACTIVE',
      },
    });

    const result = await getSong('song-1');

    expect(result.referenceLinks).toHaveLength(1);
  });
});

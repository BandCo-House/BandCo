import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getBandSongs } from './song-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

const listItem = {
  id: 'song-1',
  bandId: 'band-1',
  title: '건널목',
  artistName: 'Whiteusedsocks',
  key: null,
  bpm: 128,
  difficultyLevel: 2,
  sourceUrl: null,
  sourceType: null,
  createdAt: '2026-05-01T00:00:00+09:00',
  skills: [{ skillTypeId: 'skill-1', skillName: '일렉기타' }],
};

describe('band song api 어댑터', () => {
  it('밴드 합주곡 목록을 백엔드 경로로 조회하고 items 배열로 언랩한다', async () => {
    mock.onGet('/bands/band-1/songs').reply(200, {
      success: true,
      data: {
        items: [listItem],
        meta: { count: 1, take: 20, cursor: null, next: null },
      },
    });

    const result = await getBandSongs('band-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('song-1');
    expect(result[0]?.title).toBe('건널목');
    expect(result[0]?.artistName).toBe('Whiteusedsocks');
  });

  it('필수 필드(id)가 누락되면 reject된다', async () => {
    mock.onGet('/bands/band-1/songs').reply(200, {
      success: true,
      data: { items: [{ title: '제목만' }] },
    });

    await expect(getBandSongs('band-1')).rejects.toThrow();
  });
});

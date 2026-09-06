import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { createSong, getBandSongs, searchTracks } from './song-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

/** 백엔드 `SongListItem`이 실제로 내려주는 필드를 모두 담은 fixture. */
const listItem = {
  id: 'song-1',
  bandId: 'band-1',
  title: '건널목',
  artistName: 'Whiteusedsocks',
  key: 'FSM',
  bpm: 128,
  difficultyLevel: 2,
  sourceUrl: 'https://www.deezer.com/track/1',
  sourceType: 'DEEZER',
  externalTrackId: 'track-1',
  songCoverUrl: 'https://cdn/cover.jpg',
  songLength: 277,
  externalLinks: ['https://youtu.be/abc'],
  referenceFiles: [
    {
      id: 'ref-1',
      fileUrl: 'https://cdn/score.pdf',
      fileName: '악보.pdf',
      createdAt: '2026-05-01T00:00:00+09:00',
    },
  ],
  createdAt: '2026-05-01T00:00:00+09:00',
  skills: [{ skillTypeId: 'skill-1', skillName: '일렉기타' }],
};

const trackPreview = {
  externalTrackId: 'track-1',
  title: 'Wonderwall',
  artistName: 'Oasis',
  albumName: "(What's the Story) Morning Glory?",
  albumImageUrl: 'https://cdn/album.jpg',
  releaseDate: '1995-10-02',
  durationMs: 277_000,
  previewUrl: 'https://cdn/preview.mp3',
  sourceUrl: 'https://www.deezer.com/track/1',
  sourceType: 'DEEZER',
};

describe('band song api 어댑터', () => {
  it('밴드 합주곡 목록을 백엔드 경로로 조회하고 items 배열로 언랩한다', async () => {
    mock.onGet('/bands/band-1/songs').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
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

  it('곡 목록의 커버·길이·외부 링크·참고자료를 그대로 보존한다', async () => {
    mock.onGet('/bands/band-1/songs').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { items: [listItem], meta: {} },
    });

    const [song] = await getBandSongs('band-1');

    expect(song?.songCoverUrl).toBe('https://cdn/cover.jpg');
    expect(song?.songLength).toBe(277);
    expect(song?.key).toBe('FSM');
    expect(song?.externalLinks).toEqual(['https://youtu.be/abc']);
    expect(song?.referenceFiles[0]?.fileName).toBe('악보.pdf');
  });

  it('미리듣기 조회에 쓰는 외부 트랙 ID를 보존한다', async () => {
    mock.onGet('/bands/band-1/songs').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { items: [listItem], meta: {} },
    });

    const [song] = await getBandSongs('band-1');

    expect(song?.externalTrackId).toBe('track-1');
  });

  it('직접 입력한 곡은 외부 트랙 ID가 없어 null로 채워진다', async () => {
    const withoutTrackId: Record<string, unknown> = { ...listItem };
    delete withoutTrackId.externalTrackId;
    mock.onGet('/bands/band-1/songs').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { items: [withoutTrackId], meta: {} },
    });

    const [song] = await getBandSongs('band-1');

    expect(song?.externalTrackId).toBeNull();
  });

  it('필수 필드(id)가 누락되면 reject된다', async () => {
    mock.onGet('/bands/band-1/songs').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { items: [{ title: '제목만' }] },
    });

    await expect(getBandSongs('band-1')).rejects.toThrow();
  });

  it('알 수 없는 조성 값이 오면 reject된다', async () => {
    mock.onGet('/bands/band-1/songs').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { items: [{ ...listItem, key: 'H' }], meta: {} },
    });

    await expect(getBandSongs('band-1')).rejects.toThrow();
  });
});

describe('외부 음원 검색 어댑터', () => {
  it('검색어를 query 파라미터로 넘기고 곡 미리보기 목록을 돌려준다', async () => {
    mock.onGet('/songs/tracks/search').reply((config) => {
      expect(config.params).toEqual({ query: 'Oasis' });
      return [
        200,
        {
          status: 'success',
          error: null,
          message: '요청 성공',
          data: [trackPreview],
        },
      ];
    });

    const result = await searchTracks('Oasis');

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe('Wonderwall');
    expect(result[0]?.durationMs).toBe(277_000);
    expect(result[0]?.sourceType).toBe('DEEZER');
  });

  it('지원하지 않는 음원 출처가 오면 reject된다', async () => {
    mock.onGet('/songs/tracks/search').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: [{ ...trackPreview, sourceType: 'YOUTUBE' }],
    });

    await expect(searchTracks('Oasis')).rejects.toThrow();
  });
});

describe('곡 생성 어댑터', () => {
  it('밴드 경로로 생성 요청을 보내고 생성된 곡을 돌려준다', async () => {
    mock.onPost('/bands/band-1/songs').reply((config) => {
      expect(JSON.parse(String(config.data))).toEqual({
        title: 'Wonderwall',
        artistName: 'Oasis',
        key: 'FSM',
      });
      return [
        201,
        {
          status: 'success',
          error: null,
          message: '요청 성공',
          data: {
            song: {
              id: 'song-9',
              bandId: 'band-1',
              title: 'Wonderwall',
              artistName: 'Oasis',
            },
          },
        },
      ];
    });

    const result = await createSong('band-1', {
      title: 'Wonderwall',
      artistName: 'Oasis',
      key: 'FSM',
    });

    expect(result.song.id).toBe('song-9');
  });

  it('응답에 곡 id가 없으면 reject된다', async () => {
    mock.onPost('/bands/band-1/songs').reply(201, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { song: { bandId: 'band-1', title: 'Wonderwall' } },
    });

    await expect(
      createSong('band-1', { title: 'Wonderwall', artistName: 'Oasis' }),
    ).rejects.toThrow();
  });
});

import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type {
  CreateSongRequest,
  SongListItem,
  SongPreview,
} from '@/entities/song/model/types';
import { API_URL } from '../config';

// 밴드 라이브러리 합주곡 목록 mock (GET /bands/:bandId/songs)
// id/title은 스케줄 mock(schedule/handlers.ts)의 songs와 일치시켜 필터가 동작하게 둔다.
const SONG_FIXTURES: {
  title: string;
  artistName: string;
  hasCover?: boolean;
}[] = [
  { title: '좋은 날', artistName: '아이유' },
  { title: '봄날', artistName: '방탄소년단' },
  { title: 'Dynamite', artistName: '방탄소년단' },
  { title: '밤편지', artistName: '아이유' },
  { title: '건널목', artistName: 'Whiteusedsocks' },
  // 커버 이미지가 없는 곡. 라이브러리에서 빈 커버 표시를 확인한다.
  { title: 'Attention', artistName: '뉴진스', hasCover: false },
];

const bandSongs: SongListItem[] = SONG_FIXTURES.map((fixture, i) => ({
  id: `band-song-${i + 1}`,
  bandId: 'band-1',
  title: fixture.title,
  artistName: fixture.artistName,
  key: null,
  bpm: 128,
  difficultyLevel: 2,
  sourceUrl: null,
  sourceType: null,
  songCoverUrl:
    fixture.hasCover === false
      ? null
      : `https://picsum.photos/seed/band-song-${i + 1}/200`,
  songLength: 202,
  externalLinks: [],
  referenceFiles: [],
  createdAt: '2026-05-01T00:00:00+09:00',
  skills: [],
  // 백엔드 미리듣기 URL 추가 전까지 mock에서 샘플로 동작을 확인한다.
  previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
}));

// 외부 음원 검색 mock. '없는곡'으로 검색하면 빈 결과 → 직접 입력 경로를 확인할 수 있다.
const buildTrackResults = (query: string): SongPreview[] =>
  Array.from({ length: 3 }, (_, i) => ({
    externalTrackId: `track-${i + 1}`,
    title: `${query} 관련 곡 ${i + 1}`,
    artistName: 'DAY6(데이식스)',
    albumName: 'The Book of Us',
    albumImageUrl: `https://picsum.photos/seed/track-${i + 1}/300`,
    releaseDate: '2021-04-19',
    durationMs: 202_000,
    previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    sourceUrl: `https://www.deezer.com/track/${i + 1}`,
    sourceType: 'DEEZER' as const,
  }));

export const songHandlers = [
  http.get(`${API_URL}/bands/:bandId/songs`, () => {
    return HttpResponse.json<
      ApiResponse<{ items: SongListItem[]; meta: unknown }>
    >({
      success: true,
      data: {
        items: bandSongs,
        meta: { count: bandSongs.length, take: 20, cursor: null, next: null },
      },
    });
  }),

  http.get(`${API_URL}/songs/tracks/search`, ({ request }) => {
    const query = new URL(request.url).searchParams.get('query') ?? '';

    return HttpResponse.json<ApiResponse<SongPreview[]>>({
      success: true,
      data: query.includes('없는곡') ? [] : buildTrackResults(query),
    });
  }),

  http.post(`${API_URL}/bands/:bandId/songs`, async ({ request, params }) => {
    const body = (await request.json()) as CreateSongRequest;
    const created: SongListItem = {
      id: `band-song-${bandSongs.length + 1}`,
      bandId: String(params.bandId),
      title: body.title,
      artistName: body.artistName,
      key: body.key ?? null,
      bpm: body.bpm ?? null,
      difficultyLevel: null,
      sourceUrl: body.sourceUrl ?? null,
      sourceType: body.sourceType ?? null,
      songCoverUrl: body.songCoverUrl ?? null,
      songLength: body.songLength ?? null,
      externalLinks: body.externalLinks ?? [],
      referenceFiles: [],
      createdAt: new Date().toISOString(),
      skills: [],
      previewUrl: null,
    };
    bandSongs.push(created);

    return HttpResponse.json<ApiResponse<{ song: SongListItem }>>(
      { success: true, data: { song: created } },
      { status: 201 },
    );
  }),
];

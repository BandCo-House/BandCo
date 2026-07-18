import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { SongListItem } from '@/entities/song/model/types';
import { API_URL } from '../config';

// 밴드 라이브러리 합주곡 목록 mock (GET /bands/:bandId/songs)
// id/title은 스케줄 mock(schedule/handlers.ts)의 songs와 일치시켜 필터가 동작하게 둔다.
const SONG_FIXTURES = [
  { title: '좋은 날', artistName: '아이유' },
  { title: '봄날', artistName: '방탄소년단' },
  { title: 'Dynamite', artistName: '방탄소년단' },
  { title: '밤편지', artistName: '아이유' },
  { title: '건널목', artistName: 'Whiteusedsocks' },
  { title: 'Attention', artistName: '뉴진스' },
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
  // 백엔드 미리듣기 URL·커버 이미지 추가 전까지 mock에서 샘플로 동작을 확인한다.
  previewUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  albumImageUrl: `https://picsum.photos/seed/band-song-${i + 1}/200`,
  createdAt: '2026-05-01T00:00:00+09:00',
  skills: [],
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
];

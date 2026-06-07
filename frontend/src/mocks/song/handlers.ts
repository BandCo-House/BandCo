import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { SongListItem } from '@/entities/song/model/types';
import { API_URL } from '../config';

// 밴드 라이브러리 합주곡 목록 mock (GET /bands/:bandId/songs)
const bandSongs: SongListItem[] = Array.from({ length: 6 }, (_, i) => ({
  id: `band-song-${i + 1}`,
  bandId: 'band-1',
  title: '건널목',
  artistName: 'Whiteusedsocks',
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

import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Song } from '@/entities/song/model/types';
import { API_URL } from '../config';
import type { ProfileMusicSearchResult } from '@/features/profile-update/api/profile-music-api';

const song: Song = {
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
};

export const songHandlers = [
  http.get(`${API_URL}/users/profile-music/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query')?.trim() || '데이식스';
    const previews: ProfileMusicSearchResult[] = [
      {
        externalTrackId: 'deezer-1',
        title: '마치 흘러가는 바람처럼',
        artistName: query.includes('데이') ? 'DAY6(데이식스)' : 'DAY6',
        albumName: 'The Book of Us',
        albumImageUrl: null,
        durationMs: 202000,
        previewUrl: 'https://example.com/day6-preview.mp3',
        sourceUrl: 'https://www.deezer.com/track/demo-1',
        sourceType: 'DEEZER',
      },
      {
        externalTrackId: 'deezer-2',
        title: '건널목',
        artistName: 'Whiteusedsocks',
        albumName: '건널목',
        albumImageUrl: null,
        durationMs: 211000,
        previewUrl: 'https://example.com/crosswalk-preview.mp3',
        sourceUrl: 'https://www.deezer.com/track/demo-2',
        sourceType: 'DEEZER',
      },
    ];

    return HttpResponse.json<ApiResponse<ProfileMusicSearchResult[]>>({
      success: true,
      data: previews,
    });
  }),
  http.get(new RegExp(`^${API_URL}/songs/band-[^/]+$`), () => {
    return HttpResponse.json<ApiResponse<Song[]>>({
      success: true,
      data: [song],
    });
  }),
  http.get(`${API_URL}/songs/:id`, () => {
    return HttpResponse.json<ApiResponse<Song>>({
      success: true,
      data: song,
    });
  }),
  http.post(`${API_URL}/songs/:bandId`, async ({ request }) => {
    const body = (await request.json()) as Partial<Song>;

    return HttpResponse.json<ApiResponse<Song>>({
      success: true,
      data: {
        ...song,
        ...body,
        id: 'song-created',
      },
    });
  }),
  http.patch(`${API_URL}/songs/:songId`, async ({ request }) => {
    const body = (await request.json()) as Partial<Song>;

    return HttpResponse.json<ApiResponse<Song>>({
      success: true,
      data: {
        ...song,
        ...body,
      },
    });
  }),
  http.delete(`${API_URL}/songs/:songId`, () => {
    return HttpResponse.json<ApiResponse<void>>({
      success: true,
      data: undefined,
    });
  }),
];

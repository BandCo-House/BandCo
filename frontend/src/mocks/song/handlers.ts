import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Song } from '@/entities/song/model/types';
import { API_URL } from '../config';

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

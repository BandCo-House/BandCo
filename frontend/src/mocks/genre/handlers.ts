import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Genre } from '@/entities/genre';
import { API_URL } from '../config';

// 백엔드는 `{ genres }`로 감싸 돌려준다.
const genres: Genre[] = [
  { id: 'genre-rock', name: '록 (Rock)' },
  { id: 'genre-indie', name: '인디 (Indie)' },
  { id: 'genre-metal', name: '메탈 (Metal)' },
  { id: 'genre-punk', name: '펑크 (Punk)' },
  { id: 'genre-jazz', name: '재즈 (Jazz)' },
  { id: 'genre-blues', name: '블루스 (Blues)' },
  { id: 'genre-acoustic', name: '어쿠스틱 (Acoustic)' },
  { id: 'genre-pop-rock', name: '팝 록 (Pop Rock)' },
  { id: 'genre-jpop', name: 'J-Pop' },
  { id: 'genre-hiphop', name: 'HipHop' },
];

export const genreHandlers = [
  http.get(`${API_URL}/common/genres`, () => {
    return HttpResponse.json<ApiResponse<{ genres: Genre[] }>>({
      success: true,
      data: { genres },
    });
  }),
];

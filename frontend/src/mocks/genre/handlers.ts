import { http, HttpResponse } from 'msw';
import { API_URL } from '../config';

// 백엔드는 `{ genres }`로 감싸 돌려준다.
const genres = [
  { genreId: 'genre-rock', name: '록 (Rock)' },
  { genreId: 'genre-indie', name: '인디 (Indie)' },
  { genreId: 'genre-metal', name: '메탈 (Metal)' },
  { genreId: 'genre-punk', name: '펑크 (Punk)' },
  { genreId: 'genre-jazz', name: '재즈 (Jazz)' },
  { genreId: 'genre-blues', name: '블루스 (Blues)' },
  { genreId: 'genre-acoustic', name: '어쿠스틱 (Acoustic)' },
  { genreId: 'genre-pop-rock', name: '팝 록 (Pop Rock)' },
  { genreId: 'genre-jpop', name: 'J-Pop' },
  { genreId: 'genre-hiphop', name: 'HipHop' },
];

export const genreHandlers = [
  http.get(`${API_URL}/common/genres`, () => {
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { genres },
    });
  }),
];

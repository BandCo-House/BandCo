import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Genre } from '@/entities/genre';
import { API_URL } from '../config';

export const genreHandlers = [
  http.get(`${API_URL}/common/genres`, () => {
    return HttpResponse.json<ApiResponse<Genre[]>>({
      success: true,
      data: [
        { id: 'genre-rock', name: 'Rock' },
        { id: 'genre-metal', name: 'Metal' },
        { id: 'genre-jazz', name: 'Jazz' },
        { id: 'genre-blues', name: 'Blues' },
        { id: 'genre-pop', name: 'Pop' },
        { id: 'genre-jpop', name: 'J-Pop' },
        { id: 'genre-hiphop', name: 'HipHop' },
      ],
    });
  }),
];

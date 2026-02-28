import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Space } from '@/entities/space/model/types';
import { API_URL } from '../config';

const space: Space = {
  id: 'space-1',
  bandId: 'band-1',
  name: '2026 하계공연 무대',
  description: '여름 축제 공연 준비',
  spaceType: 'PERFORMANCE_PREP',
  eventDate: '2026-08-20',
};

export const spaceHandlers = [
  http.get(`${API_URL}/bands/:bandId/spaces`, () => {
    return HttpResponse.json<ApiResponse<Space[]>>({
      success: true,
      data: [space],
    });
  }),
  http.get(`${API_URL}/spaces/:spaceId`, () => {
    return HttpResponse.json<ApiResponse<Space>>({
      success: true,
      data: space,
    });
  }),
  http.post(`${API_URL}/bands/:bandId/spaces`, async ({ request }) => {
    const body = (await request.json()) as Partial<Space>;

    return HttpResponse.json<ApiResponse<Space>>({
      success: true,
      data: {
        ...space,
        ...body,
        id: 'space-created',
      },
    });
  }),
];

import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import { API_URL } from '../config';

// presigned 업로드 mock. 실제 S3 대신 앱이 PUT할 수 있는 목 경로를 발급한다.
export const storageHandlers = [
  http.post(`${API_URL}/storage/presigned-url`, async ({ request }) => {
    const body = (await request.json()) as {
      folder: string;
      contentType: string;
    };
    const key = `${body.folder}/${Date.now()}`;

    return HttpResponse.json<
      ApiResponse<{ presignedUrl: string; objectUrl: string }>
    >({
      success: true,
      data: {
        presignedUrl: `${API_URL}/mock-upload/${key}`,
        objectUrl: `https://mock-storage.local/${key}`,
      },
    });
  }),

  // presigned PUT 업로드: 실제 저장 없이 성공만 반환한다.
  http.put(
    `${API_URL}/mock-upload/*`,
    () => new HttpResponse(null, { status: 200 }),
  ),
];

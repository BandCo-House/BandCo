import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import { API_URL } from '../config';

const uploadedFiles = new Map<string, { blob: Blob; contentType: string }>();

// presigned 업로드 mock. 실제 S3 대신 앱이 PUT/GET할 수 있는 목 경로를 발급하고 이미지를 서빙한다.
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
        objectUrl: `${API_URL}/mock-storage/${key}`,
      },
    });
  }),

  // presigned PUT 업로드: 실제 Blob을 메모리에 저장
  http.put(
    `${API_URL}/mock-upload/:folder/:filename`,
    async ({ params, request }) => {
      const key = `${params.folder}/${params.filename}`;
      const blob = await request.blob();
      const contentType = request.headers.get('content-type') || 'image/jpeg';
      uploadedFiles.set(key, { blob, contentType });
      return new HttpResponse(null, { status: 200 });
    },
  ),

  // 업로드된 mock 이미지를 GET으로 서빙하여 브라우저에서 실제 이미지로 표시
  http.get(`${API_URL}/mock-storage/:folder/:filename`, ({ params }) => {
    const key = `${params.folder}/${params.filename}`;
    const file = uploadedFiles.get(key);
    if (file) {
      return new HttpResponse(file.blob, {
        headers: { 'Content-Type': file.contentType },
      });
    }
    return new HttpResponse(null, { status: 404 });
  }),
];

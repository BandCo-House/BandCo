import { apiPost } from './client';

interface PresignedResult {
  presignedUrl: string;
  objectUrl: string;
}

/**
 * 파일을 presigned URL 방식으로 업로드하고 접근 가능한 objectUrl을 돌려준다.
 * 1) 백엔드에서 presigned PUT URL 발급(POST /storage/presigned-url)
 * 2) 발급된 URL로 파일을 직접 PUT(인증 헤더 없이 raw body)
 * 3) 저장된 objectUrl 반환 → 생성 API의 imageUrl·songCoverUrl 등에 사용
 */
export const uploadFile = async (
  file: File,
  folder: string,
): Promise<string> => {
  const { presignedUrl, objectUrl } = await apiPost<PresignedResult>(
    '/storage/presigned-url',
    { folder, contentType: file.type },
  );

  // presigned URL은 앱 인터셉터(인증/baseURL)를 타면 안 되므로 raw fetch로 올린다.
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });

  if (!response.ok) {
    throw new Error(`파일 업로드에 실패했습니다 (${response.status})`);
  }

  return objectUrl;
};

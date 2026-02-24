import { apiPost } from '@/shared/api';

// 프론트엔드 주도 인터페이스 (API 명세 확정 전 임시)
// 명세 확정 후: endpoint/body key/응답 매핑만 이 파일에서 수정
export interface BandCreateRequest {
  name: string;
}

export interface BandCreateResponse {
  id: string;
  name: string;
}

export const createBand = (
  data: BandCreateRequest,
): Promise<BandCreateResponse> => apiPost<BandCreateResponse>('/bands', data);

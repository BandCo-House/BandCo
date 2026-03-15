import { apiPost } from '@/shared/api';

export interface BandCreateRequest {
  name: string;
  description: string | null;
  visibility: boolean;
}

export interface BandCreateResponse {
  id: string;
  name: string;
  description: string | null;
  visibility: boolean;
  inviteCode: string;
  bmId: string;
  createdAt: string;
  updatedAt: string;
}

export const createBand = (
  data: BandCreateRequest,
): Promise<BandCreateResponse> =>
  apiPost<{ band: BandCreateResponse }>('/bands', data).then(
    (response) => response.band,
  );

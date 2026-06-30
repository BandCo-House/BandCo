import { apiGet } from '@/shared/api';
import type { BandNotice, GetBandNoticesResponse } from '../model/types';

export interface GetBandNoticesParams {
  size?: number;
}

// TODO: 백엔드 공지 API가 아직 없어 MSW mock만 사용한다.
export const getBandNotices = async (
  bandId: string,
  params?: GetBandNoticesParams,
): Promise<BandNotice[]> => {
  const data = await apiGet<GetBandNoticesResponse>(
    `/bands/${bandId}/notices`,
    {
      params,
    },
  );
  return data.items;
};

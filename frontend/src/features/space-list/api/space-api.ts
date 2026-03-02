import { apiGet } from '@/shared/api';
import type { Space } from '@/entities/space/model/types';

export interface GetSpacesParams {
  query?: string;
  onlyMine?: boolean;
  inProgressOnly?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}

export const getBandSpaces = (
  bandId: string,
  params?: GetSpacesParams,
): Promise<Space[]> =>
  apiGet<Space[]>(`/bands/${bandId}/spaces`, {
    params,
  });

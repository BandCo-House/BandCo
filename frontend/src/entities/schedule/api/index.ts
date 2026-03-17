import { apiGet } from '@/shared/api/client';
import { type GetSchedulesResponse } from '../model/types';

export const getSchedules = (
  spaceId: string,
  params: { from: string; to: string },
) =>
  apiGet<GetSchedulesResponse>(`/spaces/${spaceId}/schedules`, {
    params,
  });

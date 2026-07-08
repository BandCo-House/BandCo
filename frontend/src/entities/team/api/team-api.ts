import { z } from 'zod';
import { apiGet } from '@/shared/api';
import { bandTeamListItemSchema } from '../model/schema';
import type { BandTeamListItem } from '../model/types';

export interface GetBandTeamsParams {
  order__created_at?: 'asc' | 'desc';
  order__id?: 'asc' | 'desc';
  take?: number;
  cursor__created_at?: string;
  cursor__id?: string;
}

interface GetBandTeamsResult {
  bandId?: string;
  items: unknown[];
  meta?: unknown;
}

const teamListSchema = z.array(bandTeamListItemSchema);

/**
 * 밴드 팀 목록을 조회한다.
 * 백엔드는 `{ bandId, items, meta }`를 돌려주므로 items만 파싱해 반환한다.
 */
export const getBandTeams = async (
  bandId: string,
  params?: GetBandTeamsParams,
): Promise<BandTeamListItem[]> => {
  const data = await apiGet<GetBandTeamsResult>(`/bands/${bandId}/teams`, {
    params,
  });
  return teamListSchema.parse(data.items);
};

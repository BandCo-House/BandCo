import { z } from 'zod';
import { apiGet } from '@/shared/api';
import { bandMemberListItemSchema } from '../model/schema';
import type { BandMemberListItem } from '../model/types';

export interface GetBandMembersParams {
  order__joined_at?: 'asc' | 'desc';
  order__id?: 'asc' | 'desc';
  take?: number;
  cursor__joined_at?: string;
  cursor__id?: string;
}

interface GetBandMembersResult {
  bandId?: string;
  members: unknown[];
  meta?: unknown;
}

const bandMemberListSchema = z.array(bandMemberListItemSchema);

/**
 * 밴드 멤버 목록을 조회한다.
 * 백엔드는 `{ bandId, members, meta }`를 돌려주므로 members만 파싱해 반환한다.
 */
export const getBandMembers = async (
  bandId: string,
  params?: GetBandMembersParams,
): Promise<BandMemberListItem[]> => {
  const data = await apiGet<GetBandMembersResult>(`/bands/${bandId}/users`, {
    params,
  });
  return bandMemberListSchema.parse(data.members);
};

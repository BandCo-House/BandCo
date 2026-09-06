import { z } from 'zod';
import { apiDelete, apiGet, apiPatch } from '@/shared/api';
import { bandMemberListItemSchema } from '../model/schema';
import type { BandMemberListItem, BandMemberRole } from '../model/types';

export interface GetBandMembersParams {
  order__joined_at?: 'asc' | 'desc';
  order__id?: 'asc' | 'desc';
  take?: number;
  cursor__joined_at?: string;
  cursor__id?: string;
}

// 응답 envelope 전체를 런타임 검증한다. members만 부분 신뢰하면 형태가 어긋날 때
// z.array에 undefined가 흘러가 불명확한 에러가 나므로 unknown으로 받아 통째로 parse한다.
const bandMemberResponseSchema = z.object({
  bandId: z.string().optional(),
  members: z.array(bandMemberListItemSchema),
  meta: z.unknown().optional(),
});

/**
 * 밴드 멤버 목록을 조회한다.
 * 백엔드는 `{ bandId, members, meta }`를 돌려주므로 envelope을 검증하고 members만 반환한다.
 */
export const getBandMembers = async (
  bandId: string,
  params?: GetBandMembersParams,
): Promise<BandMemberListItem[]> => {
  const data = await apiGet<unknown>(`/bands/${bandId}/users`, { params });
  return bandMemberResponseSchema.parse(data).members;
};

/** 밴드 멤버의 권한(BM | ADMIN | MEMBER)을 변경한다. 백엔드는 `{ member: { userId, role } }`를 돌려준다. */
export const updateBandMemberRole = async (
  bandId: string,
  userId: string,
  role: BandMemberRole,
): Promise<{ member: { userId: string; role: BandMemberRole } }> => {
  return apiPatch<{ member: { userId: string; role: BandMemberRole } }>(
    `/bands/${bandId}/users/${userId}`,
    { role },
  );
};

/** 밴드 멤버를 강퇴한다(DELETE /bands/:bandId/users/:userId, #71). */
export const kickBandMember = async (
  bandId: string,
  userId: string,
): Promise<{ bandId: string; userId: string; removed: boolean }> => {
  return apiDelete<{ bandId: string; userId: string; removed: boolean }>(
    `/bands/${bandId}/users/${userId}`,
  );
};

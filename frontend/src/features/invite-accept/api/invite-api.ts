import { apiGet, apiPost } from '@/shared/api';
import { getReceivedBandInvitationsResultSchema } from '@/entities/invite/model/schema';
import type { GetReceivedBandInvitationsResult } from '@/entities/invite/model/types';

export interface AcceptInviteResponse {
  invitationId: string;
  bandId: string;
  userId: string;
  invitationStatus: string;
  joinedAt: string;
}

export const acceptInvite = (inviteId: string): Promise<AcceptInviteResponse> =>
  apiPost<AcceptInviteResponse>(`/invitations/${inviteId}/accept`);

/** 받은 초대 목록 조회(GET /invitations/received). */
export const getReceivedInvitations = async (params?: {
  where__invitation_status?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  take?: number;
}): Promise<GetReceivedBandInvitationsResult> => {
  const data = await apiGet<unknown>('/invitations/received', { params });
  return getReceivedBandInvitationsResultSchema.parse(data);
};

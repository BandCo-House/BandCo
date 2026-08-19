import { apiPost, apiClient } from '@/shared/api';
import { getReceivedBandInvitationsResponseSchema } from '@/entities/invite/model/schema';
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

export const getReceivedInvitations = async (params?: {
  where__invitation_status?: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  take?: number;
}): Promise<GetReceivedBandInvitationsResult> => {
  const response = await apiClient.get('/invitations/received', { params });
  const parsed = getReceivedBandInvitationsResponseSchema.parse(response.data);
  if (parsed.status === 'error') throw new Error(parsed.message);
  return parsed.data;
};

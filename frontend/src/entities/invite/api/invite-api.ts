import { apiClient } from '@/shared/api';
import { getBandInvitationResponseSchema } from '../model/schema';
import type { ReceivedBandInvitationListItem } from '../model/types';

export const inviteKeys = {
  all: ['invitations'] as const,
  received: (status?: string) => [...inviteKeys.all, 'received', status] as const,
  detail: (invitationId: string) => [...inviteKeys.all, 'detail', invitationId] as const,
};

export const getBandInvitationDetail = async (
  invitationId: string,
): Promise<ReceivedBandInvitationListItem> => {
  const response = await apiClient.get(`/invitations/${invitationId}`);
  const parsed = getBandInvitationResponseSchema.parse(response.data);
  if (parsed.status === 'error') {
    throw new Error(parsed.message);
  }
  return parsed.data;
};

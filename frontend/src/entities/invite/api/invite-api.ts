import { apiGet } from '@/shared/api';
import { receivedBandInvitationListItemSchema } from '../model/schema';
import type { ReceivedBandInvitationListItem } from '../model/types';

export const inviteKeys = {
  all: ['invitations'] as const,
  received: (status?: string) =>
    [...inviteKeys.all, 'received', status] as const,
  detail: (invitationId: string) =>
    [...inviteKeys.all, 'detail', invitationId] as const,
};

/** 초대 단건 조회(GET /invitations/:invitationId). */
export const getBandInvitationDetail = async (
  invitationId: string,
): Promise<ReceivedBandInvitationListItem> => {
  const data = await apiGet<unknown>(`/invitations/${invitationId}`);
  return receivedBandInvitationListItemSchema.parse(data);
};

import { apiPost } from '@/shared/api';
import type { Invite } from '@/entities/invite/model/types';

export interface CreateInviteRequest {
  inviteeEmail: string;
}

/** 밴드 초대 전송(POST /bands/:bandId/invitations). */
export const createInvite = (
  bandId: string,
  data: CreateInviteRequest,
): Promise<Invite> => apiPost<Invite>(`/bands/${bandId}/invitations`, data);

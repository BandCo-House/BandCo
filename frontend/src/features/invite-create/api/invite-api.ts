import { apiPost } from '@/shared/api';
import type { Invite } from '@/entities/invite/model/types';

export interface CreateInviteRequest {
  inviteeEmail: string;
}

export const createInvite = (
  bandId: string,
  data: CreateInviteRequest,
): Promise<Invite> => apiPost<Invite>(`/bands/${bandId}/invites`, data);

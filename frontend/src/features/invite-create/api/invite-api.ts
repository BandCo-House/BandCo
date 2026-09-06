import { apiPost } from '@/shared/api';

export interface CreateInviteRequest {
  inviteeUserId: string;
  message?: string;
}

/** 백엔드 `CreateBandInvitationResult`. */
export interface CreateInviteResult {
  invitationId: string;
  bandId: string;
  inviterUserId: string;
  inviteeUserId: string;
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
}

/** 밴드 초대 전송(POST /bands/:bandId/invitations). 초대 대상은 유저 ID로 지정한다. */
export const createInvite = (
  bandId: string,
  data: CreateInviteRequest,
): Promise<CreateInviteResult> =>
  apiPost<CreateInviteResult>(`/bands/${bandId}/invitations`, data);

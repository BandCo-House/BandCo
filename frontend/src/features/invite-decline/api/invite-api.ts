import { apiPost } from '@/shared/api';

export const declineInvite = (inviteId: string): Promise<void> =>
  apiPost<void>(`/invitations/${inviteId}/decline`);

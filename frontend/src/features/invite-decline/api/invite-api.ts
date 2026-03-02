import { apiPost } from '@/shared/api';

export const declineInvite = (token: string): Promise<void> =>
  apiPost<void>(`/invites/${token}/decline`);

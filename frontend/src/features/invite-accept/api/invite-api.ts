import { apiPost } from '@/shared/api';

export const acceptInvite = (token: string): Promise<void> =>
  apiPost<void>(`/invites/${token}/accept`);

import { apiGet } from '@/shared/api';
import type { Invite } from '@/entities/invite/model/types';

export interface GetInvitesParams {
  page?: number;
  size?: number;
  sort?: string;
}

export const getInvites = (
  bandId: string,
  params?: GetInvitesParams,
): Promise<Invite[]> =>
  apiGet<Invite[]>(`/invites/${bandId}`, {
    params,
  });

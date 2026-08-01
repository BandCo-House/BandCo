import { useQuery } from '@tanstack/react-query';
import { getBandInvitationDetail, inviteKeys } from './invite-api';

interface UseBandInvitationOptions {
  enabled?: boolean;
}

export function useBandInvitation(
  invitationId: string,
  options?: UseBandInvitationOptions,
) {
  return useQuery({
    queryKey: inviteKeys.detail(invitationId),
    queryFn: () => getBandInvitationDetail(invitationId),
    enabled: options?.enabled ?? Boolean(invitationId),
  });
}

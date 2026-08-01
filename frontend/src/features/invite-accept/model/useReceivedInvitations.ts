import { useQuery } from '@tanstack/react-query';
import { getReceivedInvitations } from '../api/invite-api';

export function useReceivedInvitations(status?: 'PENDING' | 'ACCEPTED' | 'DECLINED') {
  return useQuery({
    queryKey: ['invitations', 'received', status],
    queryFn: () => getReceivedInvitations({ where__invitation_status: status, take: 50 }),
  });
}

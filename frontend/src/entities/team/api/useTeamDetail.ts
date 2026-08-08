import { useQuery } from '@tanstack/react-query';
import { getTeamDetail } from './team-api';

export const useTeamDetail = (teamId: string) => {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => getTeamDetail(teamId),
    enabled: Boolean(teamId),
  });
};

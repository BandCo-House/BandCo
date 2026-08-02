import { useQuery } from '@tanstack/react-query';
import { getBandInviteLink } from './band-api';

export const bandInviteLinkKeys = {
  all: ['band', 'invite-link'] as const,
  detail: (bandId: string) => [...bandInviteLinkKeys.all, bandId] as const,
};

/** 밴드 영구 초대 링크/코드. 만료되지 않으므로 재조회를 서두르지 않는다. */
export const useBandInviteLink = (bandId: string) =>
  useQuery({
    queryKey: bandInviteLinkKeys.detail(bandId),
    queryFn: () => getBandInviteLink(bandId),
    enabled: !!bandId,
    staleTime: 5 * 60_000,
  });

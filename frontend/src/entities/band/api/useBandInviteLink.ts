import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBandInviteLink, revokeBandInviteLink } from './band-api';
import { bandKeys } from './useBands';

/**
 * 밴드 초대 링크 발급·재발급.
 * 서버가 코드를 해시로만 보관해 재조회가 불가능하므로, 발급 응답을 화면이 들고 있어야 한다.
 */
export const useCreateBandInviteLink = (bandId: string) =>
  useMutation({
    mutationFn: () => createBandInviteLink(bandId),
  });

/** 밴드 초대 링크 폐기. 폐기 후에는 기존 링크·코드가 즉시 무효가 된다. */
export const useRevokeBandInviteLink = (bandId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => revokeBandInviteLink(bandId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bandKeys.all });
    },
  });
};

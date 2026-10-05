import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { userKeys } from '@/features/users/api';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';
import type { Paginated } from '@/shared/api/types';

import type {
  AdminBandDetail,
  AdminBandListItem,
  BandListQuery,
  DeleteBandResult,
  ExpireInviteLinkResult,
  RestoreBandResult,
  TransferBandMasterRequest,
  TransferBandMasterResult,
} from './types';

export const bandKeys = {
  all: ['bands'] as const,
  list: (query: BandListQuery) => [...bandKeys.all, 'list', query] as const,
  detail: (bandId: string) => [...bandKeys.all, 'detail', bandId] as const,
};

export const getBands = (query: BandListQuery) =>
  apiGet<Paginated<AdminBandListItem>>('/admin/bands', { params: query });

export const getBand = (bandId: string) =>
  apiGet<AdminBandDetail>(`/admin/bands/${bandId}`);

export const transferBandMaster = (
  bandId: string,
  body: TransferBandMasterRequest,
) => apiPatch<TransferBandMasterResult>(`/admin/bands/${bandId}/master`, body);

export const expireInviteLink = (bandId: string) =>
  apiPost<ExpireInviteLinkResult>(`/admin/bands/${bandId}/invite-link/expire`);

export const deleteBand = (bandId: string) =>
  apiDelete<DeleteBandResult>(`/admin/bands/${bandId}`);

export const restoreBand = (bandId: string) =>
  apiPost<RestoreBandResult>(`/admin/bands/${bandId}/restore`);

export const useBands = (query: BandListQuery) =>
  useQuery({
    queryKey: bandKeys.list(query),
    queryFn: () => getBands(query),
    placeholderData: keepPreviousData,
  });

export const useBand = (bandId: string) =>
  useQuery({
    queryKey: bandKeys.detail(bandId),
    queryFn: () => getBand(bandId),
  });

/** 밴드 변경은 회원 상세의 소속 밴드 정보에도 반영되므로 둘 다 무효화한다. */
const useInvalidateBands = () => {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: bandKeys.all }),
      queryClient.invalidateQueries({ queryKey: userKeys.all }),
    ]);
};

export const useTransferBandMaster = (bandId: string) => {
  const invalidate = useInvalidateBands();
  return useMutation({
    mutationFn: (body: TransferBandMasterRequest) =>
      transferBandMaster(bandId, body),
    onSuccess: invalidate,
  });
};

export const useExpireInviteLink = (bandId: string) => {
  const invalidate = useInvalidateBands();
  return useMutation({
    mutationFn: () => expireInviteLink(bandId),
    onSuccess: invalidate,
  });
};

export const useDeleteBand = (bandId: string) => {
  const invalidate = useInvalidateBands();
  return useMutation({
    mutationFn: () => deleteBand(bandId),
    onSuccess: invalidate,
  });
};

export const useRestoreBand = (bandId: string) => {
  const invalidate = useInvalidateBands();
  return useMutation({
    mutationFn: () => restoreBand(bandId),
    onSuccess: invalidate,
  });
};

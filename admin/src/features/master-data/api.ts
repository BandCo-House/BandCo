import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/shared/api/client';

import type {
  CreateMasterDataRequest,
  DeleteGenreResult,
  DeleteSkillTypeResult,
  Genre,
  GenreListResult,
  MasterDataItem,
  MasterDataKind,
  SkillType,
  SkillTypeListResult,
  UpdateMasterDataRequest,
} from './types';

// 계약상 이름 최대 길이
export const MASTER_DATA_NAME_MAX_LENGTH = 40;

export const masterDataKeys = {
  all: ['master-data'] as const,
  list: (kind: MasterDataKind) => [...masterDataKeys.all, kind] as const,
};

export const getGenres = () => apiGet<GenreListResult>('/admin/genres');

export const createGenre = (body: CreateMasterDataRequest) =>
  apiPost<Genre>('/admin/genres', body);

export const updateGenre = (genreId: string, body: UpdateMasterDataRequest) =>
  apiPatch<Genre>(`/admin/genres/${genreId}`, body);

export const deleteGenre = (genreId: string) =>
  apiDelete<DeleteGenreResult>(`/admin/genres/${genreId}`);

export const getSkillTypes = () =>
  apiGet<SkillTypeListResult>('/admin/skill-types');

export const createSkillType = (body: CreateMasterDataRequest) =>
  apiPost<SkillType>('/admin/skill-types', body);

export const updateSkillType = (
  skillTypeId: string,
  body: UpdateMasterDataRequest,
) => apiPatch<SkillType>(`/admin/skill-types/${skillTypeId}`, body);

export const deleteSkillType = (skillTypeId: string) =>
  apiDelete<DeleteSkillTypeResult>(`/admin/skill-types/${skillTypeId}`);

const fetchMasterData = async (
  kind: MasterDataKind,
): Promise<MasterDataItem[]> => {
  if (kind === 'genres') {
    const { genres } = await getGenres();
    return genres.map(({ genreId, ...rest }) => ({ id: genreId, ...rest }));
  }
  const { skillTypes } = await getSkillTypes();
  return skillTypes.map(({ skillTypeId, ...rest }) => ({
    id: skillTypeId,
    ...rest,
  }));
};

export const useMasterData = (kind: MasterDataKind) =>
  useQuery({
    queryKey: masterDataKeys.list(kind),
    queryFn: () => fetchMasterData(kind),
  });

const useInvalidateMasterData = (kind: MasterDataKind) => {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: masterDataKeys.list(kind) });
};

export const useCreateMasterData = (kind: MasterDataKind) => {
  const invalidate = useInvalidateMasterData(kind);
  return useMutation({
    mutationFn: (body: CreateMasterDataRequest): Promise<unknown> =>
      kind === 'genres' ? createGenre(body) : createSkillType(body),
    onSuccess: invalidate,
  });
};

export const useUpdateMasterData = (kind: MasterDataKind) => {
  const invalidate = useInvalidateMasterData(kind);
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateMasterDataRequest;
    }): Promise<unknown> =>
      kind === 'genres' ? updateGenre(id, body) : updateSkillType(id, body),
    onSuccess: invalidate,
  });
};

export const useDeleteMasterData = (kind: MasterDataKind) => {
  const invalidate = useInvalidateMasterData(kind);
  return useMutation({
    mutationFn: (id: string): Promise<unknown> =>
      kind === 'genres' ? deleteGenre(id) : deleteSkillType(id),
    onSuccess: invalidate,
  });
};

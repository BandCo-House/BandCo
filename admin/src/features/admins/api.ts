import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { authKeys } from '@/features/auth/api';
import type { AdminIdResult, AdminProfile } from '@/features/auth/types';
import { apiGet, apiPatch, apiPost } from '@/shared/api/client';

import type {
  AdminListResult,
  CreateAdminRequest,
  ResetAdminPasswordRequest,
  UpdateAdminRequest,
} from './types';

export const adminKeys = {
  all: ['admins'] as const,
};

export const getAdmins = () => apiGet<AdminListResult>('/admin/admins');

export const createAdmin = (body: CreateAdminRequest) =>
  apiPost<AdminProfile>('/admin/admins', body);

export const updateAdmin = (adminId: string, body: UpdateAdminRequest) =>
  apiPatch<AdminProfile>(`/admin/admins/${adminId}`, body);

export const resetAdminPassword = (
  adminId: string,
  body: ResetAdminPasswordRequest,
) => apiPatch<AdminIdResult>(`/admin/admins/${adminId}/password`, body);

export const useAdmins = () =>
  useQuery({ queryKey: adminKeys.all, queryFn: getAdmins });

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdmin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      adminId,
      body,
    }: {
      adminId: string;
      body: UpdateAdminRequest;
    }) => updateAdmin(adminId, body),
    // 본인 이름을 바꾸면 상단 바에도 반영되도록 내 정보도 다시 불러온다.
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.me }),
      ]),
  });
};

export const useResetAdminPassword = () =>
  useMutation({
    mutationFn: ({
      adminId,
      body,
    }: {
      adminId: string;
      body: ResetAdminPasswordRequest;
    }) => resetAdminPassword(adminId, body),
  });

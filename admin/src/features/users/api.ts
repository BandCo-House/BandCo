import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type {
  NotificationIdResult,
  SendNotificationRequest,
} from '@/features/notifications/types';
import { apiGet, apiPatch, apiPost } from '@/shared/api/client';
import type { PageQuery, Paginated } from '@/shared/api/types';

import type {
  AdminNotification,
  AdminUserDetail,
  AdminUserListItem,
  CreateSanctionRequest,
  RestoreUserResult,
  Sanction,
  SanctionListResult,
  UpdateUserStatusRequest,
  UpdateUserStatusResult,
  UserListQuery,
  WithdrawUserRequest,
  WithdrawUserResult,
} from './types';

export const userKeys = {
  all: ['users'] as const,
  list: (query: UserListQuery) => [...userKeys.all, 'list', query] as const,
  detail: (userId: string) => [...userKeys.all, 'detail', userId] as const,
  sanctions: (userId: string) =>
    [...userKeys.all, 'sanctions', userId] as const,
  notifications: (userId: string, query: PageQuery) =>
    [...userKeys.all, 'notifications', userId, query] as const,
};

export const getUsers = (query: UserListQuery) =>
  apiGet<Paginated<AdminUserListItem>>('/admin/users', { params: query });

export const getUser = (userId: string) =>
  apiGet<AdminUserDetail>(`/admin/users/${userId}`);

export const updateUserStatus = (
  userId: string,
  body: UpdateUserStatusRequest,
) => apiPatch<UpdateUserStatusResult>(`/admin/users/${userId}/status`, body);

export const withdrawUser = (userId: string, body: WithdrawUserRequest) =>
  apiPost<WithdrawUserResult>(`/admin/users/${userId}/withdraw`, body);

export const restoreUser = (userId: string) =>
  apiPost<RestoreUserResult>(`/admin/users/${userId}/restore`);

export const getUserNotifications = (userId: string, query: PageQuery) =>
  apiGet<Paginated<AdminNotification>>(`/admin/users/${userId}/notifications`, {
    params: query,
  });

export const sendUserNotification = (
  userId: string,
  body: SendNotificationRequest,
) =>
  apiPost<NotificationIdResult>(`/admin/users/${userId}/notifications`, body);

export const getUserSanctions = (userId: string) =>
  apiGet<SanctionListResult>(`/admin/users/${userId}/sanctions`);

export const createSanction = (userId: string, body: CreateSanctionRequest) =>
  apiPost<Sanction>(`/admin/users/${userId}/sanctions`, body);

export const revokeSanction = (sanctionId: string) =>
  apiPost<Sanction>(`/admin/sanctions/${sanctionId}/revoke`);

export const resendNotification = (notificationId: string) =>
  apiPost<NotificationIdResult>(
    `/admin/notifications/${notificationId}/resend`,
  );

export const useUsers = (query: UserListQuery) =>
  useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => getUsers(query),
    placeholderData: keepPreviousData,
  });

export const useUser = (userId: string) =>
  useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUser(userId),
  });

export const useUserSanctions = (userId: string) =>
  useQuery({
    queryKey: userKeys.sanctions(userId),
    queryFn: () => getUserSanctions(userId),
  });

export const useUserNotifications = (userId: string, query: PageQuery) =>
  useQuery({
    queryKey: userKeys.notifications(userId, query),
    queryFn: () => getUserNotifications(userId, query),
    placeholderData: keepPreviousData,
  });

/** 회원 관련 변경 후에는 목록·상세·제재·알림을 모두 다시 불러온다. */
const useInvalidateUsers = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: userKeys.all });
};

export const useUpdateUserStatus = (userId: string) => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (body: UpdateUserStatusRequest) =>
      updateUserStatus(userId, body),
    onSuccess: invalidate,
  });
};

export const useWithdrawUser = (userId: string) => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (body: WithdrawUserRequest) => withdrawUser(userId, body),
    onSuccess: invalidate,
  });
};

export const useRestoreUser = (userId: string) => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: () => restoreUser(userId),
    onSuccess: invalidate,
  });
};

export const useCreateSanction = (userId: string) => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (body: CreateSanctionRequest) => createSanction(userId, body),
    onSuccess: invalidate,
  });
};

export const useRevokeSanction = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: revokeSanction, onSuccess: invalidate });
};

export const useSendUserNotification = (userId: string) => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (body: SendNotificationRequest) =>
      sendUserNotification(userId, body),
    onSuccess: invalidate,
  });
};

export const useResendNotification = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: resendNotification, onSuccess: invalidate });
};

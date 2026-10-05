import { useMutation, useQuery } from '@tanstack/react-query';

import { apiGet, apiPatch, apiPost } from '@/shared/api/client';
import { LOGIN_ENDPOINT } from '@/shared/api/config';
import { setTokens } from '@/shared/lib/auth-storage';

import type {
  AdminProfile,
  ChangeMyPasswordRequest,
  ChangeMyPasswordResult,
  LoginRequest,
  LoginResult,
} from './types';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export const login = (body: LoginRequest) =>
  apiPost<LoginResult>(LOGIN_ENDPOINT, body);

export const getMe = () => apiGet<AdminProfile>('/admin/auth/me');

export const changeMyPassword = (body: ChangeMyPasswordRequest) =>
  apiPatch<ChangeMyPasswordResult>('/admin/auth/me/password', body);

export const useCurrentAdmin = () =>
  useQuery({
    queryKey: authKeys.me,
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  });

/** SUPER_ADMIN 전용 메뉴·버튼 노출 여부 */
export const useIsSuperAdmin = (): boolean =>
  useCurrentAdmin().data?.role === 'SUPER_ADMIN';

export const useLogin = () => useMutation({ mutationFn: login });

export const useChangeMyPassword = () =>
  useMutation({
    mutationFn: changeMyPassword,
    // 서버가 기존 토큰을 끊으므로 새 토큰으로 바꿔야 지금 세션이 이어진다.
    onSuccess: ({ accessToken, refreshToken }) =>
      setTokens(accessToken, refreshToken),
  });

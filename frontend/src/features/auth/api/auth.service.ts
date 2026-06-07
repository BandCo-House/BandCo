import { apiClient } from '@/shared/api/client';
import { type TokenResponse } from '@/shared/api/types';
import { type SignupReq } from '../model/auth.schema';

type BackendEmailCheckResponse = {
  status: 'success';
  error: null;
  message: string;
  data: {
    email: string;
  };
};

export type EmailDuplicateCheckResponse = {
  duplicated: boolean;
};

/**
 * 이메일 회원가입
 * @param data email, password, name
 * @returns accessToken, refreshToken
 */
export const registerEmail = async (
  data: SignupReq,
): Promise<TokenResponse> => {
  const response = await apiClient.post<TokenResponse>(
    '/auth/register/email',
    data,
  );

  return response.data;
};

/**
 * 이메일 중복 여부를 확인한다.
 */
export const checkEmailDuplicate = async (
  email: string,
): Promise<EmailDuplicateCheckResponse> => {
  const response = await apiClient.post<BackendEmailCheckResponse>(
    '/auth/email',
    { email },
  );

  return {
    duplicated: response.data.message.includes('중복'),
  };
};

/**
 * 이메일 로그인
 * @param email
 * @param password
 * @returns accessToken, refreshToken
 */
export const loginEmail = async (
  email: string,
  password: string,
): Promise<TokenResponse> => {
  // email:password 형태를 base64로 인코딩
  const credentials = btoa(`${email}:${password}`);

  const response = await apiClient.post<TokenResponse>(
    '/auth/login/email',
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );

  return response.data;
};

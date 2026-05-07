import { apiPost } from '@/shared/api/client';
import { type TokenResponse } from '@/shared/api/types';
import { type SignupReq } from '../model/auth.schema';

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
  return apiPost<TokenResponse>('/auth/register/email', data);
};

/**
 * 이메일 중복 여부를 확인한다.
 */
export const checkEmailDuplicate = async (
  email: string,
): Promise<EmailDuplicateCheckResponse> => {
  return apiPost<EmailDuplicateCheckResponse>('/auth/email/duplicate-check', {
    email,
  });
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

  return apiPost<TokenResponse>(
    '/auth/login/email',
    {}, // body는 비우고 헤더로 전송
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );
};

import { apiPost } from '@/shared/api/client';
import { type TokenResponse } from '@/shared/api/types';
import { type SignupReq } from '../model/auth.schema';

export type EmailDuplicateCheckResponse = {
  duplicated: boolean;
};

/**
 * 이메일 회원가입
 * @param data email, password, nickname
 * @returns accessToken, refreshToken
 */
export const registerEmail = async (
  data: SignupReq,
): Promise<TokenResponse> => {
  return apiPost<TokenResponse>('/auth/register/email', data);
};

/**
 * 이메일 중복 여부를 확인한다(POST /auth/email). 백엔드가 `duplicated` 플래그를 준다.
 */
export const checkEmailDuplicate = async (
  email: string,
): Promise<EmailDuplicateCheckResponse> => {
  const { duplicated } = await apiPost<{ email: string; duplicated: boolean }>(
    '/auth/email',
    { email },
  );

  return { duplicated };
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
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    },
  );
};

/**
 * Google 로그인
 * @param idToken Google Identity Services에서 받은 ID 토큰
 * @returns accessToken, refreshToken
 */
export const loginGoogle = async (idToken: string): Promise<TokenResponse> => {
  return apiPost<TokenResponse>('/auth/login/google', { idToken });
};

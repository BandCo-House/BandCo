export type JwtPayload = {
  email: string;
  id: string;
  type: 'access' | 'refresh';
};

/** 검증이 끝난 Google ID 토큰에서 추출한 유저 정보 */
export type GoogleUserPayload = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
};

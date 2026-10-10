import type { AdminRole } from 'src/generated/prisma';

/** 어드민 가드가 인증을 마치고 req.admin에 담는 값 */
export type AdminPrincipal = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

/** 어드민 JWT payload. scope로 서비스 유저 토큰과 구분한다. */
export type AdminTokenPayload = {
  sub: string;
  type: 'access' | 'refresh';
  scope: 'admin';
  /** 발급 시각(초). jwtService가 서명할 때 채운다. */
  iat?: number;
};

/** 어드민 계정 응답 형식 */
export type AdminProfile = {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

/** 본인 비밀번호 변경 결과. 기존 토큰이 모두 끊기므로 현재 세션용 새 토큰을 함께 준다. */
export type ChangeAdminPasswordResult = {
  adminId: string;
  accessToken: string;
  refreshToken: string;
};

export type AdminLoginResult = {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfile;
};

export type AdminRole = 'SUPER_ADMIN' | 'OPERATOR';

export interface AdminProfile {
  adminId: string;
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  admin: AdminProfile;
}

export interface AccessTokenResult {
  accessToken: string;
}

export interface ChangeMyPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AdminIdResult {
  adminId: string;
}

/** 비밀번호를 바꾸면 기존 토큰이 모두 끊기므로 현재 세션용 새 토큰이 함께 온다. */
export interface ChangeMyPasswordResult {
  adminId: string;
  accessToken: string;
  refreshToken: string;
}

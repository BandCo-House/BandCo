import type { BandMemberRole, UserStatus } from 'src/generated/prisma';

/** 회원 목록 상태 필터. 탈퇴·정지 여부까지 합친 운영자 관점의 상태다. */
export const ADMIN_USER_STATUS_FILTERS = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'] as const;

export type AdminUserStatusFilter = (typeof ADMIN_USER_STATUS_FILTERS)[number];

export type AdminUserListFilter = {
  keyword?: string;
  status?: AdminUserStatusFilter;
};

export type AdminUserListItem = {
  userId: string;
  email: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  status: UserStatus;
  isDeleted: boolean;
  isSuspended: boolean;
  providers: string[];
  hasPassword: boolean;
  bandCount: number;
  createdAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
};

export type AdminUserDetail = AdminUserListItem & {
  selfDescription: string | null;
  oauthAccounts: { provider: string; email: string | null; createdAt: string }[];
  bands: { bandId: string; name: string; role: BandMemberRole; joinedAt: string; isDeleted: boolean }[];
  activeSuspension: { sanctionId: string; reason: string; endsAt: string | null; createdAt: string } | null;
  reportCounts: { received: number; made: number };
};

/** 쓰기 작업 전에 대상 회원의 현재 상태를 확인하기 위한 최소 정보 */
export type AdminUserState = {
  userId: string;
  status: UserStatus;
  deletedAt: Date | null;
};

export type UpdateAdminUserStatusResult = {
  userId: string;
  status: UserStatus;
};

export type WithdrawAdminUserResult = {
  userId: string;
  deletedAt: string;
};

export type RestoreAdminUserResult = {
  userId: string;
  deletedAt: null;
  /** 복구 후 상태. 어드민 탈퇴 처리 직전 상태를 되살린다. */
  status: UserStatus;
};

/** 회원 상태 변경 입력 */
export type UpdateAdminUserStatusInput = {
  status: UserStatus;
  reason?: string;
};

import type { NotificationType } from '@/features/notifications/types';
import type { PageQuery } from '@/shared/api/types';

export type UserStatus = 'ACTIVE' | 'INACTIVE';

export type UserStatusFilter = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export type BandMemberRole = 'BM' | 'ADMIN' | 'MEMBER';

export interface AdminUserListItem {
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
}

export interface AdminUserOAuthAccount {
  provider: string;
  email: string | null;
  createdAt: string;
}

export interface AdminUserBand {
  bandId: string;
  name: string;
  role: BandMemberRole;
  joinedAt: string;
  isDeleted: boolean;
}

export interface ActiveSuspension {
  sanctionId: string;
  reason: string;
  endsAt: string | null;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {
  selfDescription: string | null;
  oauthAccounts: AdminUserOAuthAccount[];
  bands: AdminUserBand[];
  activeSuspension: ActiveSuspension | null;
  reportCounts: { received: number; made: number };
}

export interface UserListQuery extends PageQuery {
  keyword?: string;
  status?: UserStatusFilter;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
  reason?: string;
}

export interface UpdateUserStatusResult {
  userId: string;
  status: UserStatus;
}

export interface WithdrawUserRequest {
  reason?: string;
}

export interface WithdrawUserResult {
  userId: string;
  deletedAt: string;
}

export interface RestoreUserResult {
  userId: string;
  deletedAt: null;
}

export interface AdminNotification {
  notificationId: string;
  type: NotificationType;
  title: string;
  description: string | null;
  targetPath: string | null;
  isRead: boolean;
  // 오래된 알림 행은 생성 시각이 비어 있을 수 있다.
  createdAt: string | null;
}

export type SanctionType = 'WARNING' | 'SUSPENSION';

export interface AdminRef {
  adminId: string;
  name: string;
}

export interface Sanction {
  sanctionId: string;
  userId: string;
  type: SanctionType;
  reason: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: AdminRef;
  revokedAt: string | null;
  revokedBy: AdminRef | null;
}

export interface SanctionListResult {
  sanctions: Sanction[];
}

export interface CreateSanctionRequest {
  type: SanctionType;
  reason: string;
  /** ISO 8601. SUSPENSION에서 비우면 영구 정지 */
  endsAt?: string;
}

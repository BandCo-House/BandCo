import type { NotificationType } from '@/features/notifications/types';
import type { BadgeTone } from '@/shared/ui/Badge';

import type {
  BandMemberRole,
  SanctionType,
  UserStatus,
  UserStatusFilter,
} from './types';

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
};

export const USER_STATUS_FILTER_LABELS: Record<UserStatusFilter, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '이용 정지',
  DELETED: '탈퇴',
};

export const USER_STATUS_FILTERS: ReadonlyArray<UserStatusFilter> = [
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'DELETED',
];

export const SANCTION_TYPE_LABELS: Record<SanctionType, string> = {
  WARNING: '경고',
  SUSPENSION: '이용 정지',
};

export const BAND_MEMBER_ROLE_LABELS: Record<BandMemberRole, string> = {
  BM: '밴드장',
  ADMIN: '운영진',
  MEMBER: '멤버',
};

export const BAND_MEMBER_ROLE_TONES: Record<BandMemberRole, BadgeTone> = {
  BM: 'purple',
  ADMIN: 'blue',
  MEMBER: 'gray',
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  INVITE: '초대',
  NOTICE: '공지',
  REMINDER: '리마인더',
};

const PROVIDER_LABELS: Record<string, string> = {
  GOOGLE: 'Google',
};

/** 가입 수단 표시: 비밀번호가 있으면 이메일, OAuth provider는 라벨로 */
export const getLoginMethodLabels = (
  providers: string[],
  hasPassword: boolean,
): string[] => [
  ...(hasPassword ? ['이메일'] : []),
  ...providers.map((provider) => PROVIDER_LABELS[provider] ?? provider),
];

export const getUserDisplayName = (user: {
  nickname: string | null;
  email: string | null;
}): string => user.nickname || user.email || '(이름 없음)';

// 계약상 제재 사유 최대 길이
export const SANCTION_REASON_MAX_LENGTH = 500;

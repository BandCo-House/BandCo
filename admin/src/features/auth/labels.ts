import type { BadgeTone } from '@/shared/ui/Badge';

import type { AdminRole } from './types';

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: '최고 관리자',
  OPERATOR: '운영자',
};

export const ADMIN_ROLE_TONES: Record<AdminRole, BadgeTone> = {
  SUPER_ADMIN: 'purple',
  OPERATOR: 'blue',
};

// 계약상 비밀번호 길이 제한(8~72자)
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

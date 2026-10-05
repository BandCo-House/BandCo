import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
  type AuditAction,
  type AuditTargetType,
} from '@/features/audit-logs/types';
import { REPORT_STATUSES } from '@/features/reports/labels';
import type { ReportStatus } from '@/features/reports/types';
import { USER_STATUS_FILTERS } from '@/features/users/labels';
import type { UserStatusFilter } from '@/features/users/types';
import {
  parseEnum,
  parseFlag,
  parsePage,
  parseText,
} from '@/shared/lib/search';

// 목록 화면의 필터·페이지를 URL에 두어 상세에서 돌아와도 유지되게 한다.

export interface LoginSearch {
  redirect?: string;
}

export const validateLoginSearch = (
  search: Record<string, unknown>,
): LoginSearch => ({ redirect: parseText(search.redirect) });

export interface UserListSearch {
  keyword?: string;
  status?: UserStatusFilter;
  page?: number;
}

export const validateUserListSearch = (
  search: Record<string, unknown>,
): UserListSearch => ({
  keyword: parseText(search.keyword),
  status: parseEnum(search.status, USER_STATUS_FILTERS),
  page: parsePage(search.page),
});

export interface BandListSearch {
  keyword?: string;
  includeDeleted?: true;
  page?: number;
}

export const validateBandListSearch = (
  search: Record<string, unknown>,
): BandListSearch => ({
  keyword: parseText(search.keyword),
  includeDeleted: parseFlag(search.includeDeleted),
  page: parsePage(search.page),
});

export interface ReportListSearch {
  status?: ReportStatus;
  page?: number;
}

export const validateReportListSearch = (
  search: Record<string, unknown>,
): ReportListSearch => ({
  status: parseEnum(search.status, REPORT_STATUSES),
  page: parsePage(search.page),
});

export interface AuditLogSearch {
  action?: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  page?: number;
}

export const validateAuditLogSearch = (
  search: Record<string, unknown>,
): AuditLogSearch => ({
  action: parseEnum(search.action, AUDIT_ACTIONS),
  targetType: parseEnum(search.targetType, AUDIT_TARGET_TYPES),
  targetId: parseText(search.targetId),
  page: parsePage(search.page),
});

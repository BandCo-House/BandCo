import type { PageQuery } from '@/shared/api/types';

export const AUDIT_ACTIONS = [
  'ADMIN_LOGIN',
  'ADMIN_CREATE',
  'ADMIN_UPDATE',
  'ADMIN_PASSWORD_RESET',
  'ADMIN_PASSWORD_CHANGE',
  'USER_STATUS_UPDATE',
  'USER_WITHDRAW',
  'USER_RESTORE',
  'NOTIFICATION_SEND',
  'NOTIFICATION_RESEND',
  'NOTIFICATION_BROADCAST',
  'SANCTION_CREATE',
  'SANCTION_REVOKE',
  'BAND_MASTER_TRANSFER',
  'BAND_INVITE_LINK_EXPIRE',
  'BAND_DELETE',
  'BAND_RESTORE',
  'GENRE_CREATE',
  'GENRE_UPDATE',
  'GENRE_DELETE',
  'SKILL_TYPE_CREATE',
  'SKILL_TYPE_UPDATE',
  'SKILL_TYPE_DELETE',
  'REPORT_RESOLVE',
  'ANNOUNCEMENT_CREATE',
  'ANNOUNCEMENT_UPDATE',
  'ANNOUNCEMENT_DELETE',
  'SERVICE_SETTINGS_UPDATE',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_TARGET_TYPES = [
  'ADMIN',
  'USER',
  'NOTIFICATION',
  'SANCTION',
  'BAND',
  'GENRE',
  'SKILL_TYPE',
  'REPORT',
  'ANNOUNCEMENT',
  'SERVICE_SETTINGS',
] as const;

export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];

export interface AuditLog {
  auditLogId: string;
  admin: { adminId: string; name: string; email: string };
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string | null;
  detail: unknown;
  createdAt: string;
}

export interface AuditLogQuery extends PageQuery {
  adminId?: string;
  targetType?: AuditTargetType;
  targetId?: string;
  action?: AuditAction;
}

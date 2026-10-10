export const ADMIN_AUDIT_ACTIONS = [
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

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export const ADMIN_AUDIT_TARGET_TYPES = [
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

export type AdminAuditTargetType = (typeof ADMIN_AUDIT_TARGET_TYPES)[number];

/** JSON 컬럼에 그대로 저장할 수 있는 감사 로그 상세 값 */
export type AdminAuditDetail = Record<string, string | number | boolean | null | string[]>;

export type RecordAdminAuditLogInput = {
  adminUserId: string;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId: string | null;
  detail?: AdminAuditDetail;
};

export type AdminAuditLogFilter = {
  adminId?: string;
  action?: AdminAuditAction;
  targetType?: AdminAuditTargetType;
  targetId?: string;
};

export type AdminAuditLogListItem = {
  auditLogId: string;
  admin: { adminId: string; name: string; email: string };
  action: string;
  targetType: string;
  targetId: string | null;
  detail: unknown;
  createdAt: string;
};

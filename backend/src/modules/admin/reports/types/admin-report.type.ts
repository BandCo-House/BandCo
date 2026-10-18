import type { UserReportReason, UserReportStatus } from 'src/generated/prisma';

/** 신고 응답에 담는 유저 요약 */
export type AdminReportUser = {
  userId: string;
  nickname: string | null;
  email: string | null;
};

/** 어드민 신고 응답 형식 */
export type AdminReport = {
  reportId: string;
  reason: UserReportReason;
  description: string | null;
  status: UserReportStatus;
  reporter: AdminReportUser;
  reported: AdminReportUser & { isSuspended: boolean };
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  resolvedBy: { adminId: string; name: string } | null;
};

export type AdminReportFilter = {
  status?: UserReportStatus;
};

/** 신고 처리 결과로 고를 수 있는 상태. PENDING으로 되돌리는 처리는 없다. */
export const ADMIN_REPORT_RESOLUTION_STATUSES = ['RESOLVED', 'DISMISSED'] as const;

export type AdminReportResolutionStatus = (typeof ADMIN_REPORT_RESOLUTION_STATUSES)[number];

export type ResolveAdminReportInput = {
  status: AdminReportResolutionStatus;
  resolutionNote?: string;
};

/** 신고 처리 시 저장할 값 */
export type ResolveAdminReportData = {
  status: AdminReportResolutionStatus;
  resolutionNote: string | null;
  resolvedAt: Date;
  resolvedByAdminId: string;
};

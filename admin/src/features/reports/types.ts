import type { AdminRef } from '@/features/users/types';
import type { PageQuery } from '@/shared/api/types';

export type ReportReason =
  'SPAM' | 'ABUSE' | 'INAPPROPRIATE_CONTENT' | 'FRAUD' | 'OTHER';

export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export type ReportResolution = Exclude<ReportStatus, 'PENDING'>;

export interface ReportUser {
  userId: string;
  nickname: string | null;
  email: string | null;
}

export interface Report {
  reportId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  reporter: ReportUser;
  reported: ReportUser & { isSuspended: boolean };
  createdAt: string;
  resolvedAt: string | null;
  resolutionNote: string | null;
  resolvedBy: AdminRef | null;
}

export interface ReportListQuery extends PageQuery {
  status?: ReportStatus;
}

export interface ResolveReportRequest {
  status: ReportResolution;
  resolutionNote?: string;
}

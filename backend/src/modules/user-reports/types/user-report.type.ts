import type { UserReportReason } from 'src/generated/prisma';

export type CreateUserReportInput = {
  reason: UserReportReason;
  description?: string;
};

/** 신고 저장 시 넘기는 값 */
export type CreateUserReportData = {
  reporterUserId: string;
  reportedUserId: string;
  reason: UserReportReason;
  description: string | null;
};

export type CreateUserReportResult = {
  reportId: string;
};

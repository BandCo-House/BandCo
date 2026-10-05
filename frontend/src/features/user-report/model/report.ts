import { z } from 'zod';

export const reportReasonSchema = z.enum([
  'SPAM',
  'ABUSE',
  'INAPPROPRIATE_CONTENT',
  'FRAUD',
  'OTHER',
]);

export type ReportReason = z.infer<typeof reportReasonSchema>;

/** 화면에 보이는 순서. 백엔드 enum 순서와 같다. */
export const REPORT_REASONS = reportReasonSchema.options;

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: '스팸·광고',
  ABUSE: '욕설·비방',
  INAPPROPRIATE_CONTENT: '부적절한 콘텐츠',
  FRAUD: '사기',
  OTHER: '기타',
};

/** 백엔드 DTO의 description 최대 길이. */
export const REPORT_DESCRIPTION_MAX_LENGTH = 1000;

export interface CreateUserReportRequest {
  reason: ReportReason;
  description?: string;
}

export const createUserReportResponseSchema = z.object({
  reportId: z.string(),
});

export type CreateUserReportResponse = z.infer<
  typeof createUserReportResponseSchema
>;

import { describe, expect, it } from 'vitest';
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  createUserReportResponseSchema,
  reportReasonSchema,
} from './report';

describe('신고 사유', () => {
  it('백엔드 enum 다섯 가지를 모두 라벨과 함께 제공한다', () => {
    expect(REPORT_REASONS).toEqual([
      'SPAM',
      'ABUSE',
      'INAPPROPRIATE_CONTENT',
      'FRAUD',
      'OTHER',
    ]);
    REPORT_REASONS.forEach((reason) => {
      expect(REPORT_REASON_LABELS[reason]).toBeTruthy();
    });
  });

  it('정의되지 않은 사유는 통과시키지 않는다', () => {
    expect(reportReasonSchema.safeParse('HATE').success).toBe(false);
  });
});

describe('createUserReportResponseSchema', () => {
  it('reportId가 있으면 통과하고 없으면 실패한다', () => {
    expect(createUserReportResponseSchema.parse({ reportId: 'r1' })).toEqual({
      reportId: 'r1',
    });
    expect(createUserReportResponseSchema.safeParse({}).success).toBe(false);
  });
});

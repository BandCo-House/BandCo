import type { BadgeTone } from '@/shared/ui/Badge';

import type { ReportReason, ReportStatus } from './types';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SPAM: '스팸',
  ABUSE: '욕설·비방',
  INAPPROPRIATE_CONTENT: '부적절한 콘텐츠',
  FRAUD: '사기',
  OTHER: '기타',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: '대기',
  RESOLVED: '처리 완료',
  DISMISSED: '기각',
};

export const REPORT_STATUS_TONES: Record<ReportStatus, BadgeTone> = {
  PENDING: 'yellow',
  RESOLVED: 'green',
  DISMISSED: 'gray',
};

export const REPORT_STATUSES: ReadonlyArray<ReportStatus> = [
  'PENDING',
  'RESOLVED',
  'DISMISSED',
];

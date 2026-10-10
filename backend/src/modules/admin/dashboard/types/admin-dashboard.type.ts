/** GET /admin/dashboard/summary 응답 */
export type AdminDashboardSummary = {
  users: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    deleted: number;
    newToday: number;
    newLast7Days: number;
    newLast30Days: number;
  };
  activity: { dau: number; wau: number; mau: number };
  bands: { total: number; activeLast30Days: number };
  bandSpaces: { total: number };
  schedules: { total: number; createdLast30Days: number };
  reports: { pending: number };
  generatedAt: string;
};

/** Repository가 세는 요약 숫자. 생성 시각은 Service가 붙인다. */
export type AdminDashboardSummaryCounts = Omit<AdminDashboardSummary, 'generatedAt'>;

/** 요약 숫자를 셀 때 쓰는 시각 경계. 경계 계산(KST·롤링 기간)은 Service가 한다. */
export type AdminDashboardSummaryCriteria = {
  /** 활성 정지 판정 기준 시각 */
  now: Date;
  /** 신규 가입 집계 시작 시각(KST 달력 기준, 오늘 포함) */
  newUsersSince: { today: Date; last7Days: Date; last30Days: Date };
  /** DAU/WAU/MAU 집계 시작 시각(지금부터 1/7/30일 전) */
  lastLoginSince: { day: Date; week: Date; month: Date };
  /** 최근 30일 활동(일정 생성) 집계 시작 시각 */
  recentActivitySince: Date;
};

/** GET /admin/dashboard/signups 응답 */
export type AdminDashboardSignups = {
  days: { date: string; count: number }[];
};

/** 퍼널 단계. 배열 순서가 응답 순서다. */
export const ADMIN_DASHBOARD_FUNNEL_STEPS = [
  { key: 'SIGNED_UP', label: '가입' },
  { key: 'PROFILE_COMPLETED', label: '프로필 완성' },
  { key: 'JOINED_BAND', label: '밴드 가입' },
  { key: 'CREATED_SCHEDULE', label: '첫 일정 생성' },
] as const;

export type AdminDashboardFunnelStepKey = (typeof ADMIN_DASHBOARD_FUNNEL_STEPS)[number]['key'];

/** 퍼널 단계별 코호트 인원 */
export type AdminDashboardFunnelCounts = Record<AdminDashboardFunnelStepKey, number>;

/** GET /admin/dashboard/funnel 응답 */
export type AdminDashboardFunnel = {
  from: string;
  to: string;
  steps: { key: AdminDashboardFunnelStepKey; label: string; count: number }[];
};

/** 퍼널 조회 기간(KST 날짜). 비어 있으면 기본값(오늘 포함 최근 30일)을 쓴다. */
export type AdminDashboardFunnelRange = {
  from?: string;
  to?: string;
};

/** 스토리지 상위 유저 표시에 쓰는 유저 식별 정보 */
export type AdminDashboardUserIdentity = {
  userId: string;
  nickname: string | null;
  email: string | null;
};

/** GET /admin/dashboard/storage 응답 */
export type AdminDashboardStorage = {
  totalBytes: number;
  objectCount: number;
  topUsers: (AdminDashboardUserIdentity & { bytes: number; objectCount: number })[];
  otherBytes: number;
  scannedAt: string;
};

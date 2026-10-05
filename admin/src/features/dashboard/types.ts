export interface DashboardSummary {
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
}

export interface SignupDay {
  /** KST `YYYY-MM-DD` */
  date: string;
  count: number;
}

export interface SignupsResult {
  days: SignupDay[];
}

export type FunnelStepKey =
  'SIGNED_UP' | 'PROFILE_COMPLETED' | 'JOINED_BAND' | 'CREATED_SCHEDULE';

export interface FunnelStep {
  key: FunnelStepKey;
  label: string;
  count: number;
}

export interface FunnelQuery {
  /** KST `YYYY-MM-DD` */
  from?: string;
  /** KST `YYYY-MM-DD` (포함) */
  to?: string;
}

export interface FunnelResult {
  from: string;
  to: string;
  steps: FunnelStep[];
}

export interface StorageTopUser {
  userId: string;
  nickname: string | null;
  email: string | null;
  bytes: number;
  objectCount: number;
}

export interface StorageResult {
  totalBytes: number;
  objectCount: number;
  topUsers: StorageTopUser[];
  otherBytes: number;
  scannedAt: string;
}

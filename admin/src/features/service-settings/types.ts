import type { AdminRef } from '@/features/users/types';

export interface ServiceSettings {
  maintenanceEnabled: boolean;
  maintenanceMessage: string | null;
  minAppVersion: string | null;
  updatedAt: string | null;
  updatedBy: AdminRef | null;
}

export interface UpdateServiceSettingsRequest {
  maintenanceEnabled?: boolean;
  /** 최대 500자, null이면 비운다 */
  maintenanceMessage?: string | null;
  /** `x.y.z` 형식, null이면 비운다 */
  minAppVersion?: string | null;
}

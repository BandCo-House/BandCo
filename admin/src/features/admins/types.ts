import type { AdminProfile, AdminRole } from '@/features/auth/types';

export interface AdminListResult {
  admins: AdminProfile[];
}

export interface CreateAdminRequest {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
}

export interface UpdateAdminRequest {
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
}

export interface ResetAdminPasswordRequest {
  newPassword: string;
}

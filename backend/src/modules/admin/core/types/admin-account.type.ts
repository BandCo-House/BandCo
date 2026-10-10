import type { AdminRole } from 'src/generated/prisma';

export type CreateAdminInput = {
  email: string;
  name: string;
  password: string;
  role: AdminRole;
};

export type UpdateAdminInput = {
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
};

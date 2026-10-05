import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from 'src/generated/prisma';

export const ADMIN_ROLES_KEY = 'adminRoles';

/** 핸들러·컨트롤러에 필요한 어드민 역할을 지정한다. AdminRolesGuard가 읽는다. */
export const AdminRoles = (...roles: AdminRole[]) => SetMetadata(ADMIN_ROLES_KEY, roles);

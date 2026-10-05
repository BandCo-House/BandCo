import { type CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AdminRole } from 'src/generated/prisma';

import { ADMIN_ROLES_KEY } from '../decorator/admin-roles.decorator';
import type { AdminPrincipal } from '../types/admin-principal.type';

/**
 * @AdminRoles()로 지정한 역할만 통과시킨다. 지정이 없으면 모든 어드민을 허용한다.
 * AdminAccessTokenGuard 다음에 와야 req.admin이 채워져 있다.
 */
@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[] | undefined>(ADMIN_ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (requiredRoles === undefined || requiredRoles.length === 0) {
      return true;
    }

    const admin: AdminPrincipal | undefined = context.switchToHttp().getRequest().admin;
    if (admin === undefined || !requiredRoles.includes(admin.role)) {
      throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
    }
    return true;
  }
}

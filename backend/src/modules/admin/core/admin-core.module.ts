import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AdminRolesGuard } from './guard/admin-roles.guard';
import { AdminAccessTokenGuard, AdminRefreshTokenGuard } from './guard/admin-token.guard';
import { AdminAuditLogsPrismaRepository } from './repositories/admin-audit-logs.prisma-repository';
import { ADMIN_AUDIT_LOGS_REPOSITORY } from './repositories/admin-audit-logs.repository';
import { AdminUsersPrismaRepository } from './repositories/admin-users.prisma-repository';
import { ADMIN_USERS_REPOSITORY } from './repositories/admin-users.repository';
import { AdminAccountsController } from './admin-accounts.controller';
import { AdminAccountsService } from './admin-accounts.service';
import { AdminAuditLogsController } from './admin-audit-logs.controller';
import { AdminAuditLogsService } from './admin-audit-logs.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';

/**
 * 어드민 인증·계정·감사 로그. 다른 어드민 영역 모듈은 이 모듈을 import해
 * 가드(AdminAccessTokenGuard, AdminRolesGuard)와 AdminAuditLogsService를 쓴다.
 */
@Module({
  imports: [JwtModule.register({})],
  controllers: [AdminAuthController, AdminAccountsController, AdminAuditLogsController],
  providers: [
    AdminAuthService,
    AdminAccountsService,
    AdminAuditLogsService,
    AdminAccessTokenGuard,
    AdminRefreshTokenGuard,
    AdminRolesGuard,
    AdminUsersPrismaRepository,
    { provide: ADMIN_USERS_REPOSITORY, useExisting: AdminUsersPrismaRepository },
    AdminAuditLogsPrismaRepository,
    { provide: ADMIN_AUDIT_LOGS_REPOSITORY, useExisting: AdminAuditLogsPrismaRepository },
  ],
  exports: [AdminAuthService, AdminAuditLogsService, AdminAccessTokenGuard, AdminRolesGuard],
})
export class AdminCoreModule {}

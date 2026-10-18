import { Module } from '@nestjs/common';

import { AdminCoreModule } from '../core/admin-core.module';

import { AdminManagedUsersPrismaRepository } from './repositories/admin-managed-users.prisma-repository';
import { ADMIN_MANAGED_USERS_REPOSITORY } from './repositories/admin-managed-users.repository';
import { AdminUserNotificationsPrismaRepository } from './repositories/admin-user-notifications.prisma-repository';
import { ADMIN_USER_NOTIFICATIONS_REPOSITORY } from './repositories/admin-user-notifications.repository';
import { AdminUserSanctionsPrismaRepository } from './repositories/admin-user-sanctions.prisma-repository';
import { ADMIN_USER_SANCTIONS_REPOSITORY } from './repositories/admin-user-sanctions.repository';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminSanctionsController } from './admin-sanctions.controller';
import { AdminSanctionsService } from './admin-sanctions.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

/** 어드민 회원 관리: 회원 조회·상태·탈퇴, 회원 알림 발송, 제재 */
@Module({
  imports: [AdminCoreModule],
  controllers: [AdminUsersController, AdminNotificationsController, AdminSanctionsController],
  providers: [
    AdminUsersService,
    AdminNotificationsService,
    AdminSanctionsService,
    { provide: ADMIN_MANAGED_USERS_REPOSITORY, useClass: AdminManagedUsersPrismaRepository },
    { provide: ADMIN_USER_NOTIFICATIONS_REPOSITORY, useClass: AdminUserNotificationsPrismaRepository },
    { provide: ADMIN_USER_SANCTIONS_REPOSITORY, useClass: AdminUserSanctionsPrismaRepository },
  ],
})
export class AdminUsersModule {}

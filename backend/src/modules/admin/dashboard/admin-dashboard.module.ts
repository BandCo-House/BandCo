import { Module } from '@nestjs/common';

import { AdminCoreModule } from '../core/admin-core.module';

import { AdminDashboardPrismaRepository } from './repositories/admin-dashboard.prisma-repository';
import { ADMIN_DASHBOARD_REPOSITORY } from './repositories/admin-dashboard.repository';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

/**
 * 어드민 대시보드(/admin/dashboard). StorageService는 전역 StorageModule이 제공하므로 따로 import하지 않는다.
 */
@Module({
  imports: [AdminCoreModule],
  controllers: [AdminDashboardController],
  providers: [
    AdminDashboardService,
    AdminDashboardPrismaRepository,
    { provide: ADMIN_DASHBOARD_REPOSITORY, useExisting: AdminDashboardPrismaRepository },
  ],
})
export class AdminDashboardModule {}

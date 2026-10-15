import { Module } from '@nestjs/common';

import { AdminAnnouncementsModule } from './announcements/admin-announcements.module';
import { AdminBandsModule } from './bands/admin-bands.module';
import { AdminCoreModule } from './core/admin-core.module';
import { AdminDashboardModule } from './dashboard/admin-dashboard.module';
import { AdminMasterDataModule } from './master-data/admin-master-data.module';
import { AdminReportsModule } from './reports/admin-reports.module';
import { AdminServiceSettingsModule } from './service-settings/admin-service-settings.module';
import { AdminUsersModule } from './users/admin-users.module';

/** 어드민 콘솔 API 전체를 묶는다. 영역별 모듈은 AdminCoreModule의 가드와 감사 로그를 공유한다. */
@Module({
  imports: [
    AdminCoreModule,
    AdminDashboardModule,
    AdminUsersModule,
    AdminBandsModule,
    AdminMasterDataModule,
    AdminReportsModule,
    AdminAnnouncementsModule,
    AdminServiceSettingsModule,
  ],
})
export class AdminModule {}

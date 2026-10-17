import { Module } from '@nestjs/common';
import { ServiceStatusModule } from 'src/modules/service-status/service-status.module';

import { AdminCoreModule } from '../core/admin-core.module';

import { AdminServiceSettingsPrismaRepository } from './repositories/admin-service-settings.prisma-repository';
import { ADMIN_SERVICE_SETTINGS_REPOSITORY } from './repositories/admin-service-settings.repository';
import { AdminServiceSettingsController } from './admin-service-settings.controller';
import { AdminServiceSettingsService } from './admin-service-settings.service';

/**
 * 어드민 서비스 설정(/admin/service-settings).
 * 변경 후 점검 미들웨어 캐시를 비우려고 ServiceStatusModule의 ServiceSettingsCache를 가져온다.
 */
@Module({
  imports: [AdminCoreModule, ServiceStatusModule],
  controllers: [AdminServiceSettingsController],
  providers: [AdminServiceSettingsService, { provide: ADMIN_SERVICE_SETTINGS_REPOSITORY, useClass: AdminServiceSettingsPrismaRepository }],
})
export class AdminServiceSettingsModule {}

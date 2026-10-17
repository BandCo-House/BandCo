import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';

import { ServiceStatusPrismaRepository } from './repositories/service-status.prisma-repository';
import { SERVICE_STATUS_REPOSITORY } from './repositories/service-status.repository';
import { MaintenanceModeMiddleware } from './maintenance-mode.middleware';
import { ServiceSettingsCache } from './service-settings-cache';
import { ServiceStatusController } from './service-status.controller';
import { ServiceStatusService } from './service-status.service';

/**
 * 공개 서비스 상태·공지 API와 점검 모드 미들웨어.
 * ServiceSettingsCache를 export해 어드민 설정 변경 후 같은 캐시 인스턴스를 비울 수 있게 한다.
 */
@Module({
  controllers: [ServiceStatusController],
  providers: [ServiceStatusService, ServiceSettingsCache, { provide: SERVICE_STATUS_REPOSITORY, useClass: ServiceStatusPrismaRepository }],
  exports: [ServiceSettingsCache],
})
export class ServiceStatusModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Nest 11(path-to-regexp v8)은 이름 없는 '*'를 받지 않으므로 이름 붙인 와일드카드로 모든 경로를 잡는다.
    consumer.apply(MaintenanceModeMiddleware).forRoutes('{*splat}');
  }
}

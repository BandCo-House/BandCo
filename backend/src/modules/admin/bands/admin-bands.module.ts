import { Module } from '@nestjs/common';

import { AdminCoreModule } from '../core/admin-core.module';

import { AdminBandsPrismaRepository } from './repositories/admin-bands.prisma-repository';
import { ADMIN_BANDS_REPOSITORY } from './repositories/admin-bands.repository';
import { AdminBandsController } from './admin-bands.controller';
import { AdminBandsService } from './admin-bands.service';

/** 어드민 밴드 관리(/admin/bands). 가드와 감사 로그는 AdminCoreModule에서 가져온다. */
@Module({
  imports: [AdminCoreModule],
  controllers: [AdminBandsController],
  providers: [AdminBandsService, { provide: ADMIN_BANDS_REPOSITORY, useClass: AdminBandsPrismaRepository }],
})
export class AdminBandsModule {}

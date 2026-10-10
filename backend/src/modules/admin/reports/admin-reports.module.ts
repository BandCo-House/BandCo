import { Module } from '@nestjs/common';

import { AdminCoreModule } from '../core/admin-core.module';

import { AdminReportsPrismaRepository } from './repositories/admin-reports.prisma-repository';
import { ADMIN_REPORTS_REPOSITORY } from './repositories/admin-reports.repository';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';

/** 어드민 신고 관리(/admin/reports). 가드와 감사 로그는 AdminCoreModule에서 가져온다. */
@Module({
  imports: [AdminCoreModule],
  controllers: [AdminReportsController],
  providers: [AdminReportsService, { provide: ADMIN_REPORTS_REPOSITORY, useClass: AdminReportsPrismaRepository }],
})
export class AdminReportsModule {}

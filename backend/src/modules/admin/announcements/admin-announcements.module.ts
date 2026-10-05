import { Module } from '@nestjs/common';

import { AdminCoreModule } from '../core/admin-core.module';

import { AdminAnnouncementsPrismaRepository } from './repositories/admin-announcements.prisma-repository';
import { ADMIN_ANNOUNCEMENTS_REPOSITORY } from './repositories/admin-announcements.repository';
import { AdminAnnouncementsController } from './admin-announcements.controller';
import { AdminAnnouncementsService } from './admin-announcements.service';

/** 어드민 공지 관리(/admin/announcements). 공개 노출 API는 ServiceStatusModule이 담당한다. */
@Module({
  imports: [AdminCoreModule],
  controllers: [AdminAnnouncementsController],
  providers: [AdminAnnouncementsService, { provide: ADMIN_ANNOUNCEMENTS_REPOSITORY, useClass: AdminAnnouncementsPrismaRepository }],
})
export class AdminAnnouncementsModule {}

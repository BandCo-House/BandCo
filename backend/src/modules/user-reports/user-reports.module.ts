import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { UsersModule } from 'src/modules/users/users.module';

import { UserReportsPrismaRepository } from './repositories/user-reports.prisma-repository';
import { USER_REPORTS_REPOSITORY } from './repositories/user-reports.repository';
import { UserReportsController } from './user-reports.controller';
import { UserReportsService } from './user-reports.service';

/** 유저용 신고 접수(POST /users/:userId/reports). 처리는 어드민 신고 모듈이 담당한다. */
@Module({
  imports: [AuthModule, UsersModule],
  controllers: [UserReportsController],
  providers: [UserReportsService, AccessTokenGuard, { provide: USER_REPORTS_REPOSITORY, useClass: UserReportsPrismaRepository }],
})
export class UserReportsModule {}

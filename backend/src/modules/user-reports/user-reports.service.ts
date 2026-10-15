import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { USER_REPORTS_REPOSITORY, type UserReportsRepository } from './repositories/user-reports.repository';
import type { CreateUserReportInput, CreateUserReportResult } from './types/user-report.type';

@Injectable()
export class UserReportsService {
  constructor(
    @Inject(USER_REPORTS_REPOSITORY)
    private readonly userReportsRepository: UserReportsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 다른 유저를 신고한다.
   * 같은 대상에게 처리 대기 신고가 남아 있으면 중복 접수를 막아 운영자 큐가 같은 건으로 쌓이지 않게 한다.
   *
   * @param {string} reporterUserId - 인증된 신고자 ID
   * @param {string} reportedUserId - 신고 대상 유저 ID
   * @param {CreateUserReportInput} input - 신고 사유와 설명
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateUserReportResult>} 생성된 신고 ID
   */
  async createUserReport(
    reporterUserId: string,
    reportedUserId: string,
    input: CreateUserReportInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateUserReportResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateUserReportResult> => {
      if (reporterUserId === reportedUserId) {
        throw new BadRequestException('본인은 신고할 수 없습니다.');
      }

      const isReportedUserActive = await this.userReportsRepository.existsActiveUser(reportedUserId, client);
      if (!isReportedUserActive) {
        throw new NotFoundException('신고 대상 유저를 찾을 수 없습니다.');
      }

      const hasPendingReport = await this.userReportsRepository.existsPendingReport(reporterUserId, reportedUserId, client);
      if (hasPendingReport) {
        throw new ConflictException('이미 처리 대기 중인 신고가 있습니다.');
      }

      return this.userReportsRepository.create(
        { reporterUserId, reportedUserId, reason: input.reason, description: input.description ?? null },
        client,
      );
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }
}

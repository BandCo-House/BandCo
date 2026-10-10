import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import type { CreateUserReportData, CreateUserReportResult } from '../types/user-report.type';

import type { UserReportsRepository } from './user-reports.repository';

@Injectable()
export class UserReportsPrismaRepository implements UserReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsActiveUser(userId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx ?? this.prisma;
    const user = await client.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true } });
    return user !== null;
  }

  async existsPendingReport(reporterUserId: string, reportedUserId: string, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx ?? this.prisma;
    const report = await client.userReport.findFirst({
      where: { reporterUserId, reportedUserId, status: 'PENDING' },
      select: { id: true },
    });
    return report !== null;
  }

  async create(data: CreateUserReportData, tx?: Prisma.TransactionClient): Promise<CreateUserReportResult> {
    const client = tx ?? this.prisma;
    const report = await client.userReport.create({
      data: {
        reporterUserId: data.reporterUserId,
        reportedUserId: data.reportedUserId,
        reason: data.reason,
        description: data.description,
      },
      select: { id: true },
    });
    return { reportId: report.id };
  }
}

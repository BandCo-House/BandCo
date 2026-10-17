import { Injectable } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { buildActiveSuspensionWhere } from 'src/common/sanction/active-suspension.where';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { toSkipTake } from '../../core/types/admin-paginated.type';
import type { AdminReport, AdminReportFilter, ResolveAdminReportData } from '../types/admin-report.type';

import type { AdminReportsRepository } from './admin-reports.repository';

/** 신고 응답에 필요한 컬럼. 피신고자 정지 여부는 활성 정지 제재가 한 건이라도 있는지로 판단한다. */
function buildAdminReportSelect(now: Date) {
  return {
    id: true,
    reason: true,
    description: true,
    status: true,
    createdAt: true,
    resolvedAt: true,
    resolutionNote: true,
    reporter: { select: { id: true, email: true, profile: { select: { nickname: true } } } },
    reported: {
      select: {
        id: true,
        email: true,
        profile: { select: { nickname: true } },
        sanctions: { where: buildActiveSuspensionWhere(now), select: { id: true }, take: 1 },
      },
    },
    resolvedByAdmin: { select: { id: true, name: true } },
  } satisfies Prisma.UserReportSelect;
}

type AdminReportRow = Prisma.UserReportGetPayload<{ select: ReturnType<typeof buildAdminReportSelect> }>;

function toAdminReport(row: AdminReportRow): AdminReport {
  return {
    reportId: row.id,
    reason: row.reason,
    description: row.description,
    status: row.status,
    reporter: {
      userId: row.reporter.id,
      nickname: row.reporter.profile?.nickname ?? null,
      email: row.reporter.email,
    },
    reported: {
      userId: row.reported.id,
      nickname: row.reported.profile?.nickname ?? null,
      email: row.reported.email,
      isSuspended: row.reported.sanctions.length > 0,
    },
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    resolutionNote: row.resolutionNote,
    resolvedBy: row.resolvedByAdmin === null ? null : { adminId: row.resolvedByAdmin.id, name: row.resolvedByAdmin.name },
  };
}

@Injectable()
export class AdminReportsPrismaRepository implements AdminReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filter: AdminReportFilter,
    pagination: PaginationParams,
    now: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminReport[]; totalCount: number }> {
    const client = tx ?? this.prisma;
    const where: Prisma.UserReportWhereInput = { status: filter.status };

    const [rows, totalCount] = await Promise.all([
      client.userReport.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(pagination),
        select: buildAdminReportSelect(now),
      }),
      client.userReport.count({ where }),
    ]);

    return { items: rows.map(toAdminReport), totalCount };
  }

  async findById(reportId: string, now: Date, tx?: Prisma.TransactionClient): Promise<AdminReport | null> {
    const client = tx ?? this.prisma;
    const row = await client.userReport.findUnique({
      where: { id: reportId },
      select: buildAdminReportSelect(now),
    });

    if (row === null) {
      return null;
    }

    return toAdminReport(row);
  }

  async resolvePending(reportId: string, data: ResolveAdminReportData, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx ?? this.prisma;
    const result = await client.userReport.updateMany({
      where: { id: reportId, status: 'PENDING' },
      data: {
        status: data.status,
        resolutionNote: data.resolutionNote,
        resolvedAt: data.resolvedAt,
        resolvedByAdminId: data.resolvedByAdminId,
      },
    });

    return result.count > 0;
  }
}

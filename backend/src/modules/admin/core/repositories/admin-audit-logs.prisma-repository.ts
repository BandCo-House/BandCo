import { Injectable } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import type { AdminAuditLogFilter, AdminAuditLogListItem, RecordAdminAuditLogInput } from '../types/admin-audit.type';
import { toSkipTake } from '../types/admin-paginated.type';

import type { AdminAuditLogsRepository } from './admin-audit-logs.repository';

@Injectable()
export class AdminAuditLogsPrismaRepository implements AdminAuditLogsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: RecordAdminAuditLogInput, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.adminAuditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        detail: input.detail,
      },
    });
  }

  async findMany(
    filter: AdminAuditLogFilter,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminAuditLogListItem[]; totalCount: number }> {
    const client = tx ?? this.prisma;
    const where: Prisma.AdminAuditLogWhereInput = {
      adminUserId: filter.adminId,
      action: filter.action,
      targetType: filter.targetType,
      targetId: filter.targetId,
    };

    const [logs, totalCount] = await Promise.all([
      client.adminAuditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(pagination),
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          detail: true,
          createdAt: true,
          adminUser: { select: { id: true, name: true, email: true } },
        },
      }),
      client.adminAuditLog.count({ where }),
    ]);

    const items = logs.map(log => ({
      auditLogId: log.id,
      admin: { adminId: log.adminUser.id, name: log.adminUser.name, email: log.adminUser.email },
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      detail: log.detail,
      createdAt: log.createdAt.toISOString(),
    }));

    return { items, totalCount };
  }
}

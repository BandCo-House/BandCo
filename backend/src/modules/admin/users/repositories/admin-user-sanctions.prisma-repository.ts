import { Injectable } from '@nestjs/common';
import { buildActiveSuspensionWhere } from 'src/common/sanction/active-suspension.where';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import type { AdminSanctionRecord, CreateAdminSanctionRecordInput } from '../types/admin-sanction.type';

import type { AdminUserSanctionsRepository } from './admin-user-sanctions.repository';

const SANCTION_SELECT = {
  id: true,
  userId: true,
  type: true,
  reason: true,
  endsAt: true,
  createdAt: true,
  revokedAt: true,
  createdByAdmin: { select: { id: true, name: true } },
  revokedByAdmin: { select: { id: true, name: true } },
} satisfies Prisma.UserSanctionSelect;

type SanctionRow = Prisma.UserSanctionGetPayload<{ select: typeof SANCTION_SELECT }>;

function toAdminSanctionRecord(row: SanctionRow): AdminSanctionRecord {
  return {
    sanctionId: row.id,
    userId: row.userId,
    type: row.type,
    reason: row.reason,
    endsAt: row.endsAt,
    createdAt: row.createdAt,
    createdBy: { adminId: row.createdByAdmin.id, name: row.createdByAdmin.name },
    revokedAt: row.revokedAt,
    revokedBy: row.revokedByAdmin === null ? null : { adminId: row.revokedByAdmin.id, name: row.revokedByAdmin.name },
  };
}

@Injectable()
export class AdminUserSanctionsPrismaRepository implements AdminUserSanctionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSanctionsByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<AdminSanctionRecord[]> {
    const client = tx ?? this.prisma;
    const rows = await client.userSanction.findMany({
      where: { userId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: SANCTION_SELECT,
    });

    return rows.map(toAdminSanctionRecord);
  }

  async findSanctionById(sanctionId: string, tx?: Prisma.TransactionClient): Promise<AdminSanctionRecord | null> {
    const client = tx ?? this.prisma;
    const row = await client.userSanction.findUnique({ where: { id: sanctionId }, select: SANCTION_SELECT });

    if (row === null) {
      return null;
    }

    return toAdminSanctionRecord(row);
  }

  async hasActiveSuspension(userId: string, now: Date, tx?: Prisma.TransactionClient): Promise<boolean> {
    const client = tx ?? this.prisma;
    const count = await client.userSanction.count({ where: { userId, ...buildActiveSuspensionWhere(now) } });
    return count > 0;
  }

  async createSanction(input: CreateAdminSanctionRecordInput, tx?: Prisma.TransactionClient): Promise<AdminSanctionRecord> {
    const client = tx ?? this.prisma;
    const row = await client.userSanction.create({
      data: {
        userId: input.userId,
        type: input.type,
        reason: input.reason,
        endsAt: input.endsAt,
        createdByAdminId: input.createdByAdminId,
      },
      select: SANCTION_SELECT,
    });

    return toAdminSanctionRecord(row);
  }

  async revokeSanction(sanctionId: string, revokedByAdminId: string, revokedAt: Date, tx?: Prisma.TransactionClient): Promise<AdminSanctionRecord> {
    const client = tx ?? this.prisma;
    const row = await client.userSanction.update({
      where: { id: sanctionId },
      data: { revokedAt, revokedByAdminId },
      select: SANCTION_SELECT,
    });

    return toAdminSanctionRecord(row);
  }
}

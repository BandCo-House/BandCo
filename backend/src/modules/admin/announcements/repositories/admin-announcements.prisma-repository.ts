import { Injectable } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { toSkipTake } from '../../core/types/admin-paginated.type';
import type { AdminAnnouncement, CreateAnnouncementData, UpdateAnnouncementData } from '../types/admin-announcement.type';

import type { AdminAnnouncementsRepository } from './admin-announcements.repository';

const ADMIN_ANNOUNCEMENT_SELECT = {
  id: true,
  title: true,
  content: true,
  isPublished: true,
  startsAt: true,
  endsAt: true,
  createdAt: true,
  updatedAt: true,
  createdByAdmin: { select: { id: true, name: true } },
} satisfies Prisma.AnnouncementSelect;

type AdminAnnouncementRow = Prisma.AnnouncementGetPayload<{ select: typeof ADMIN_ANNOUNCEMENT_SELECT }>;

function toAdminAnnouncement(row: AdminAnnouncementRow): AdminAnnouncement {
  return {
    announcementId: row.id,
    title: row.title,
    content: row.content,
    isPublished: row.isPublished,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    createdBy: { adminId: row.createdByAdmin.id, name: row.createdByAdmin.name },
  };
}

@Injectable()
export class AdminAnnouncementsPrismaRepository implements AdminAnnouncementsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(pagination: PaginationParams, tx?: Prisma.TransactionClient): Promise<{ items: AdminAnnouncement[]; totalCount: number }> {
    const client = tx ?? this.prisma;
    const [rows, totalCount] = await Promise.all([
      client.announcement.findMany({
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(pagination),
        select: ADMIN_ANNOUNCEMENT_SELECT,
      }),
      client.announcement.count(),
    ]);

    return { items: rows.map(toAdminAnnouncement), totalCount };
  }

  async findById(announcementId: string, tx?: Prisma.TransactionClient): Promise<AdminAnnouncement | null> {
    const client = tx ?? this.prisma;
    const row = await client.announcement.findUnique({ where: { id: announcementId }, select: ADMIN_ANNOUNCEMENT_SELECT });

    if (row === null) {
      return null;
    }

    return toAdminAnnouncement(row);
  }

  async create(data: CreateAnnouncementData, tx?: Prisma.TransactionClient): Promise<AdminAnnouncement> {
    const client = tx ?? this.prisma;
    const row = await client.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        isPublished: data.isPublished,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        createdByAdminId: data.createdByAdminId,
      },
      select: ADMIN_ANNOUNCEMENT_SELECT,
    });

    return toAdminAnnouncement(row);
  }

  async update(announcementId: string, data: UpdateAnnouncementData, tx?: Prisma.TransactionClient): Promise<AdminAnnouncement> {
    const client = tx ?? this.prisma;
    const row = await client.announcement.update({
      where: { id: announcementId },
      data: {
        title: data.title,
        content: data.content,
        isPublished: data.isPublished,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
      select: ADMIN_ANNOUNCEMENT_SELECT,
    });

    return toAdminAnnouncement(row);
  }

  async delete(announcementId: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.announcement.delete({ where: { id: announcementId } });
  }
}

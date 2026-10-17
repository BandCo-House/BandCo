import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { type ActiveAnnouncement, SERVICE_SETTING_ROW_ID, type ServiceStatus } from '../types/service-status.type';

import type { ServiceStatusRepository } from './service-status.repository';

@Injectable()
export class ServiceStatusPrismaRepository implements ServiceStatusRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findServiceStatus(tx?: Prisma.TransactionClient): Promise<ServiceStatus | null> {
    const client = tx ?? this.prisma;
    return client.serviceSetting.findUnique({
      where: { id: SERVICE_SETTING_ROW_ID },
      select: { maintenanceEnabled: true, maintenanceMessage: true, minAppVersion: true },
    });
  }

  async findActiveAnnouncements(now: Date, tx?: Prisma.TransactionClient): Promise<ActiveAnnouncement[]> {
    const client = tx ?? this.prisma;
    const rows = await client.announcement.findMany({
      where: {
        isPublished: true,
        AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, title: true, content: true, startsAt: true, endsAt: true },
    });

    return rows.map(row => ({
      announcementId: row.id,
      title: row.title,
      content: row.content,
      startsAt: row.startsAt?.toISOString() ?? null,
      endsAt: row.endsAt?.toISOString() ?? null,
    }));
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';
import { SERVICE_SETTING_ROW_ID } from 'src/modules/service-status/types/service-status.type';

import type { AdminServiceSettings, UpdateServiceSettingsInput } from '../types/admin-service-settings.type';

import type { AdminServiceSettingsRepository } from './admin-service-settings.repository';

const ADMIN_SERVICE_SETTINGS_SELECT = {
  maintenanceEnabled: true,
  maintenanceMessage: true,
  minAppVersion: true,
  updatedAt: true,
  updatedByAdmin: { select: { id: true, name: true } },
} satisfies Prisma.ServiceSettingSelect;

type AdminServiceSettingsRow = Prisma.ServiceSettingGetPayload<{ select: typeof ADMIN_SERVICE_SETTINGS_SELECT }>;

function toAdminServiceSettings(row: AdminServiceSettingsRow): AdminServiceSettings {
  return {
    maintenanceEnabled: row.maintenanceEnabled,
    maintenanceMessage: row.maintenanceMessage,
    minAppVersion: row.minAppVersion,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedByAdmin === null ? null : { adminId: row.updatedByAdmin.id, name: row.updatedByAdmin.name },
  };
}

@Injectable()
export class AdminServiceSettingsPrismaRepository implements AdminServiceSettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findServiceSettings(tx?: Prisma.TransactionClient): Promise<AdminServiceSettings | null> {
    const client = tx ?? this.prisma;
    const row = await client.serviceSetting.findUnique({ where: { id: SERVICE_SETTING_ROW_ID }, select: ADMIN_SERVICE_SETTINGS_SELECT });

    if (row === null) {
      return null;
    }

    return toAdminServiceSettings(row);
  }

  async upsertServiceSettings(
    input: UpdateServiceSettingsInput,
    updatedByAdminId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminServiceSettings> {
    const client = tx ?? this.prisma;
    const data = {
      maintenanceEnabled: input.maintenanceEnabled,
      maintenanceMessage: input.maintenanceMessage,
      minAppVersion: input.minAppVersion,
      updatedByAdminId,
    };

    const row = await client.serviceSetting.upsert({
      where: { id: SERVICE_SETTING_ROW_ID },
      create: { id: SERVICE_SETTING_ROW_ID, ...data },
      update: data,
      select: ADMIN_SERVICE_SETTINGS_SELECT,
    });

    return toAdminServiceSettings(row);
  }
}

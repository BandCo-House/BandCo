import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';
import { ServiceSettingsCache } from 'src/modules/service-status/service-settings-cache';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditDetail } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { ADMIN_SERVICE_SETTINGS_REPOSITORY, type AdminServiceSettingsRepository } from './repositories/admin-service-settings.repository';
import { type AdminServiceSettings, DEFAULT_ADMIN_SERVICE_SETTINGS, type UpdateServiceSettingsInput } from './types/admin-service-settings.type';

/**
 * 요청값 중 실제로 값이 달라지는 필드만 골라 새 값으로 담는다.
 * 감사 로그에서 무엇이 바뀌었는지 바로 보이게 하려는 용도다.
 */
function buildChangedSettingsDetail(before: AdminServiceSettings, input: UpdateServiceSettingsInput): AdminAuditDetail {
  const detail: AdminAuditDetail = {};

  if (input.maintenanceEnabled !== undefined && input.maintenanceEnabled !== before.maintenanceEnabled) {
    detail.maintenanceEnabled = input.maintenanceEnabled;
  }
  if (input.maintenanceMessage !== undefined && input.maintenanceMessage !== before.maintenanceMessage) {
    detail.maintenanceMessage = input.maintenanceMessage;
  }
  if (input.minAppVersion !== undefined && input.minAppVersion !== before.minAppVersion) {
    detail.minAppVersion = input.minAppVersion;
  }

  return detail;
}

@Injectable()
export class AdminServiceSettingsService {
  constructor(
    @Inject(ADMIN_SERVICE_SETTINGS_REPOSITORY)
    private readonly serviceSettingsRepository: AdminServiceSettingsRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly serviceSettingsCache: ServiceSettingsCache,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 서비스 설정을 조회한다. 아직 저장한 적이 없으면 기본값을 돌려준다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminServiceSettings>} 서비스 설정
   */
  async getServiceSettings(tx?: Prisma.TransactionClient): Promise<AdminServiceSettings> {
    const serviceSettings = await this.serviceSettingsRepository.findServiceSettings(tx);
    if (serviceSettings === null) {
      return { ...DEFAULT_ADMIN_SERVICE_SETTINGS };
    }

    return serviceSettings;
  }

  /**
   * 서비스 설정을 id=1 행에 upsert하고 바뀐 값을 감사 로그로 남긴다.
   * 저장이 끝나면 점검 미들웨어 캐시를 비워 같은 프로세스에는 바로 반영한다.
   * 외부 tx가 있으면 커밋 전에 캐시를 비우게 되므로, 커밋 전 잠깐은 옛 값이 다시 캐시될 수 있다.
   *
   * @param {AdminPrincipal} actor - 요청한 SUPER_ADMIN
   * @param {UpdateServiceSettingsInput} input - 바꿀 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminServiceSettings>} 저장된 서비스 설정
   */
  async updateServiceSettings(
    actor: AdminPrincipal,
    input: UpdateServiceSettingsInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminServiceSettings> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminServiceSettings> => {
      const before = (await this.serviceSettingsRepository.findServiceSettings(client)) ?? DEFAULT_ADMIN_SERVICE_SETTINGS;
      const updated = await this.serviceSettingsRepository.upsertServiceSettings(input, actor.id, client);
      await this.auditLogsService.record(
        {
          adminUserId: actor.id,
          action: 'SERVICE_SETTINGS_UPDATE',
          targetType: 'SERVICE_SETTINGS',
          targetId: null,
          detail: buildChangedSettingsDetail(before, input),
        },
        client,
      );

      return updated;
    };

    const result = tx ? await run(tx) : await this.prisma.$transaction(run);
    this.serviceSettingsCache.invalidate();

    return result;
  }
}

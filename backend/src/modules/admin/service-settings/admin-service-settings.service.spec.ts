import type { PrismaService } from 'src/database/prisma';
import type { ServiceStatusRepository } from 'src/modules/service-status/repositories/service-status.repository';
import { ServiceSettingsCache } from 'src/modules/service-status/service-settings-cache';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditLogsRepository } from '../core/repositories/admin-audit-logs.repository';
import type { RecordAdminAuditLogInput } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminServiceSettingsRepository } from './repositories/admin-service-settings.repository';
import type { AdminServiceSettings, UpdateServiceSettingsInput } from './types/admin-service-settings.type';
import { AdminServiceSettingsService } from './admin-service-settings.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const ADMIN_ID = '11111111-1111-4111-8111-111111111111';

const SUPER_ADMIN: AdminPrincipal = { id: ADMIN_ID, email: 'super@bandco.kr', name: '최고관리자', role: 'SUPER_ADMIN' };

const STORED_SETTINGS: AdminServiceSettings = {
  maintenanceEnabled: false,
  maintenanceMessage: '점검 예정',
  minAppVersion: '1.0.0',
  updatedAt: '2026-10-01T00:00:00.000Z',
  updatedBy: { adminId: ADMIN_ID, name: '최고관리자' },
};

// ─── Repository Stub ─────────────────────────────────────────────
function createServiceSettingsRepositoryStub(options?: {
  stored?: AdminServiceSettings | null;
  onFind?: (tx: unknown) => void;
  onUpsert?: (input: UpdateServiceSettingsInput, updatedByAdminId: string, tx: unknown) => void;
}): AdminServiceSettingsRepository {
  return {
    async findServiceSettings(tx) {
      options?.onFind?.(tx);
      if (options?.stored !== undefined) {
        return options.stored;
      }
      return STORED_SETTINGS;
    },
    async upsertServiceSettings(input, updatedByAdminId, tx) {
      options?.onUpsert?.(input, updatedByAdminId, tx);
      return {
        maintenanceEnabled: input.maintenanceEnabled ?? STORED_SETTINGS.maintenanceEnabled,
        maintenanceMessage: input.maintenanceMessage !== undefined ? input.maintenanceMessage : STORED_SETTINGS.maintenanceMessage,
        minAppVersion: input.minAppVersion !== undefined ? input.minAppVersion : STORED_SETTINGS.minAppVersion,
        updatedAt: '2026-10-05T00:00:00.000Z',
        updatedBy: { adminId: updatedByAdminId, name: SUPER_ADMIN.name },
      };
    },
  };
}

function createAuditLogsServiceStub(options?: { onRecord?: (input: RecordAdminAuditLogInput, tx: unknown) => void }): AdminAuditLogsService {
  const repository: AdminAuditLogsRepository = {
    async create(input, tx) {
      options?.onRecord?.(input, tx);
    },
    async findMany() {
      return { items: [], totalCount: 0 };
    },
  };
  return new AdminAuditLogsService(repository);
}

/** 캐시가 DB를 몇 번 읽었는지 세어 무효화 여부를 확인한다. */
function createServiceSettingsCacheStub(): { cache: ServiceSettingsCache; getLoadCount: () => number } {
  let loadCount = 0;
  const repository: ServiceStatusRepository = {
    async findServiceStatus() {
      loadCount += 1;
      return null;
    },
    async findActiveAnnouncements() {
      return [];
    },
  };
  return { cache: new ServiceSettingsCache(repository, () => 0), getLoadCount: () => loadCount };
}

// ─── PrismaService Stub ──────────────────────────────────────────
function createPrismaServiceStub(): PrismaService {
  const tx = { transactionClient: true };
  return {
    async $transaction(callback: (client: unknown) => Promise<unknown>) {
      return callback(tx);
    },
  } as unknown as PrismaService;
}

function createPrismaServiceFailingTransactionStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}

function createService(options?: {
  repository?: AdminServiceSettingsRepository;
  auditLogsService?: AdminAuditLogsService;
  cache?: ServiceSettingsCache;
  prisma?: PrismaService;
}): AdminServiceSettingsService {
  return new AdminServiceSettingsService(
    options?.repository ?? createServiceSettingsRepositoryStub(),
    options?.auditLogsService ?? createAuditLogsServiceStub(),
    options?.cache ?? createServiceSettingsCacheStub().cache,
    options?.prisma ?? createPrismaServiceStub(),
  );
}

describe('AdminServiceSettingsService', () => {
  describe('getServiceSettings', () => {
    it('저장된 설정을 반환한다', async () => {
      const service = createService();

      const result = await service.getServiceSettings();

      expect(result).toEqual(STORED_SETTINGS);
    });

    it('설정 행이 없으면 기본값을 반환한다', async () => {
      const service = createService({ repository: createServiceSettingsRepositoryStub({ stored: null }) });

      const result = await service.getServiceSettings();

      expect(result).toEqual({ maintenanceEnabled: false, maintenanceMessage: null, minAppVersion: null, updatedAt: null, updatedBy: null });
    });
  });

  describe('updateServiceSettings', () => {
    it('요청값과 변경한 어드민으로 upsert하고 저장된 설정을 반환한다', async () => {
      let capturedInput: UpdateServiceSettingsInput | undefined;
      let capturedAdminId: string | undefined;
      const repository = createServiceSettingsRepositoryStub({
        onUpsert(input, updatedByAdminId) {
          capturedInput = input;
          capturedAdminId = updatedByAdminId;
        },
      });
      const service = createService({ repository });

      const result = await service.updateServiceSettings(SUPER_ADMIN, { maintenanceEnabled: true, minAppVersion: null });

      expect(capturedInput).toEqual({ maintenanceEnabled: true, minAppVersion: null });
      expect(capturedAdminId).toBe(ADMIN_ID);
      expect(result.maintenanceEnabled).toBe(true);
      expect(result.minAppVersion).toBeNull();
    });

    it('실제로 값이 바뀐 필드만 감사 로그에 남긴다', async () => {
      const capturedAuditInputs: RecordAdminAuditLogInput[] = [];
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(input) {
          capturedAuditInputs.push(input);
        },
      });
      const service = createService({ auditLogsService });

      // maintenanceMessage는 저장된 값과 같아서 빠진다.
      await service.updateServiceSettings(SUPER_ADMIN, { maintenanceEnabled: true, maintenanceMessage: '점검 예정', minAppVersion: null });

      expect(capturedAuditInputs).toEqual([
        {
          adminUserId: ADMIN_ID,
          action: 'SERVICE_SETTINGS_UPDATE',
          targetType: 'SERVICE_SETTINGS',
          targetId: null,
          detail: { maintenanceEnabled: true, minAppVersion: null },
        },
      ]);
    });

    it('설정 행이 없으면 기본값과 비교해 바뀐 필드를 남긴다', async () => {
      const capturedAuditInputs: RecordAdminAuditLogInput[] = [];
      const repository = createServiceSettingsRepositoryStub({ stored: null });
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(input) {
          capturedAuditInputs.push(input);
        },
      });
      const service = createService({ repository, auditLogsService });

      await service.updateServiceSettings(SUPER_ADMIN, { maintenanceEnabled: false, minAppVersion: '2.0.0' });

      expect(capturedAuditInputs[0].detail).toEqual({ minAppVersion: '2.0.0' });
    });

    it('저장 후 점검 캐시를 비워 다음 조회에서 DB를 다시 읽게 한다', async () => {
      const { cache, getLoadCount } = createServiceSettingsCacheStub();
      const service = createService({ cache });
      await cache.getServiceStatus();

      await service.updateServiceSettings(SUPER_ADMIN, { maintenanceEnabled: true });
      await cache.getServiceStatus();

      expect(getLoadCount()).toBe(2);
    });

    it('저장에 실패하면 캐시를 비우지 않는다', async () => {
      const { cache, getLoadCount } = createServiceSettingsCacheStub();
      const repository: AdminServiceSettingsRepository = {
        ...createServiceSettingsRepositoryStub(),
        async upsertServiceSettings() {
          throw new Error('저장 실패');
        },
      };
      const service = createService({ repository, cache });
      await cache.getServiceStatus();

      await expect(service.updateServiceSettings(SUPER_ADMIN, { maintenanceEnabled: true })).rejects.toThrow('저장 실패');
      await cache.getServiceStatus();

      expect(getLoadCount()).toBe(1);
    });

    it('조회·저장·감사 로그를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createServiceSettingsRepositoryStub({
        onFind(tx) {
          capturedTransactions.push(tx);
        },
        onUpsert(_input, _adminId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = createService({ repository, auditLogsService });

      await service.updateServiceSettings(SUPER_ADMIN, { maintenanceEnabled: true });

      expect(capturedTransactions).toHaveLength(3);
      expect(new Set(capturedTransactions).size).toBe(1);
      expect(capturedTransactions[0]).toEqual({ transactionClient: true });
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { externalTransactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createServiceSettingsRepositoryStub({
        onUpsert(_input, _adminId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = createService({ repository, prisma: createPrismaServiceFailingTransactionStub() });

      await service.updateServiceSettings(SUPER_ADMIN, { maintenanceEnabled: true }, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });
});

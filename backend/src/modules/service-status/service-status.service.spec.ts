import type { ServiceStatusRepository } from './repositories/service-status.repository';
import type { ActiveAnnouncement, ServiceStatus } from './types/service-status.type';
import { ServiceSettingsCache } from './service-settings-cache';
import { ServiceStatusService } from './service-status.service';

const ANNOUNCEMENT_ID = '11111111-1111-4111-8111-111111111111';

const STORED_STATUS: ServiceStatus = { maintenanceEnabled: false, maintenanceMessage: null, minAppVersion: '1.4.0' };

const ACTIVE_ANNOUNCEMENT: ActiveAnnouncement = {
  announcementId: ANNOUNCEMENT_ID,
  title: '정기 점검 안내',
  content: '10월 10일 새벽 점검이 있습니다.',
  startsAt: null,
  endsAt: '2026-10-11T00:00:00.000Z',
};

// ─── Repository Stub ─────────────────────────────────────────────
function createServiceStatusRepositoryStub(options?: {
  status?: ServiceStatus | null;
  onFindServiceStatus?: (tx: unknown) => void;
  onFindActiveAnnouncements?: (now: Date, tx: unknown) => void;
}): ServiceStatusRepository {
  return {
    async findServiceStatus(tx) {
      options?.onFindServiceStatus?.(tx);
      if (options?.status !== undefined) {
        return options.status;
      }
      return STORED_STATUS;
    },
    async findActiveAnnouncements(now, tx) {
      options?.onFindActiveAnnouncements?.(now, tx);
      return [ACTIVE_ANNOUNCEMENT];
    },
  };
}

function createService(repository: ServiceStatusRepository): ServiceStatusService {
  return new ServiceStatusService(repository, new ServiceSettingsCache(repository, () => 0));
}

describe('ServiceStatusService', () => {
  describe('getServiceStatus', () => {
    it('저장된 설정을 캐시를 거쳐 반환한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createServiceStatusRepositoryStub({
        onFindServiceStatus(tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = createService(repository);

      await service.getServiceStatus();
      const result = await service.getServiceStatus();

      expect(result).toEqual(STORED_STATUS);
      expect(capturedTransactions).toEqual([undefined]);
    });

    it('설정 행이 없으면 기본값을 반환한다', async () => {
      const service = createService(createServiceStatusRepositoryStub({ status: null }));

      const result = await service.getServiceStatus();

      expect(result).toEqual({ maintenanceEnabled: false, maintenanceMessage: null, minAppVersion: null });
    });

    it('외부 transaction client가 있으면 캐시를 거치지 않고 그 client로 읽는다', async () => {
      const externalTx = { externalTransactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createServiceStatusRepositoryStub({
        onFindServiceStatus(tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = createService(repository);

      await service.getServiceStatus();
      await service.getServiceStatus(externalTx as never);

      expect(capturedTransactions).toEqual([undefined, externalTx]);
    });

    it('외부 transaction에서 설정 행이 없으면 기본값을 반환한다', async () => {
      const service = createService(createServiceStatusRepositoryStub({ status: null }));

      const result = await service.getServiceStatus({ externalTransactionClient: true } as never);

      expect(result).toEqual({ maintenanceEnabled: false, maintenanceMessage: null, minAppVersion: null });
    });
  });

  describe('getActiveAnnouncements', () => {
    it('현재 시각 기준으로 노출 중인 공지를 감싸서 반환한다', async () => {
      let capturedNow: Date | undefined;
      const repository = createServiceStatusRepositoryStub({
        onFindActiveAnnouncements(now) {
          capturedNow = now;
        },
      });
      const service = createService(repository);
      const beforeCall = Date.now();

      const result = await service.getActiveAnnouncements();

      expect(result).toEqual({ announcements: [ACTIVE_ANNOUNCEMENT] });
      expect(capturedNow?.getTime()).toBeGreaterThanOrEqual(beforeCall);
    });

    it('외부 transaction client를 그대로 전달한다', async () => {
      const externalTx = { externalTransactionClient: true };
      let capturedTransaction: unknown;
      const repository = createServiceStatusRepositoryStub({
        onFindActiveAnnouncements(_now, tx) {
          capturedTransaction = tx;
        },
      });
      const service = createService(repository);

      await service.getActiveAnnouncements(externalTx as never);

      expect(capturedTransaction).toBe(externalTx);
    });
  });
});

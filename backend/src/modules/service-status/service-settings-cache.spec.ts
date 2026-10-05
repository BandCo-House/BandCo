import type { ServiceStatusRepository } from './repositories/service-status.repository';
import type { ServiceStatus } from './types/service-status.type';
import { SERVICE_SETTINGS_CACHE_TTL_MS, ServiceSettingsCache } from './service-settings-cache';

const MAINTENANCE_STATUS: ServiceStatus = { maintenanceEnabled: true, maintenanceMessage: '점검 중', minAppVersion: '1.2.0' };

// ─── Repository Stub ─────────────────────────────────────────────
function createServiceStatusRepositoryStub(options?: {
  /** 조회할 때마다 차례로 돌려줄 값. 다 쓰면 마지막 값을 반복한다. Error면 던진다. */
  responses?: Array<ServiceStatus | null | Error>;
  onFindServiceStatus?: () => void;
}): ServiceStatusRepository {
  const responses = options?.responses ?? [MAINTENANCE_STATUS];
  let callCount = 0;

  return {
    async findServiceStatus() {
      options?.onFindServiceStatus?.();
      const response = responses[Math.min(callCount, responses.length - 1)];
      callCount += 1;
      if (response instanceof Error) {
        throw response;
      }
      return response;
    },
    async findActiveAnnouncements() {
      return [];
    },
  };
}

/** 테스트가 직접 움직이는 시계 */
function createManualClock(startAt: number): { now: () => number; advance: (ms: number) => void } {
  let currentTime = startAt;
  return {
    now: () => currentTime,
    advance: (ms: number) => {
      currentTime += ms;
    },
  };
}

describe('ServiceSettingsCache', () => {
  it('설정 행이 없으면 기본값을 돌려준다', async () => {
    const repository = createServiceStatusRepositoryStub({ responses: [null] });
    const cache = new ServiceSettingsCache(repository, createManualClock(0).now);

    const result = await cache.getServiceStatus();

    expect(result).toEqual({ maintenanceEnabled: false, maintenanceMessage: null, minAppVersion: null });
  });

  it('TTL 안에서는 DB를 다시 읽지 않는다', async () => {
    let capturedLoadCount = 0;
    const clock = createManualClock(1_000);
    const repository = createServiceStatusRepositoryStub({
      onFindServiceStatus() {
        capturedLoadCount += 1;
      },
    });
    const cache = new ServiceSettingsCache(repository, clock.now);

    await cache.getServiceStatus();
    clock.advance(SERVICE_SETTINGS_CACHE_TTL_MS - 1);
    const result = await cache.getServiceStatus();

    expect(capturedLoadCount).toBe(1);
    expect(result).toEqual(MAINTENANCE_STATUS);
  });

  it('TTL이 지나면 DB를 다시 읽어 새 값을 돌려준다', async () => {
    let capturedLoadCount = 0;
    const clock = createManualClock(1_000);
    const repository = createServiceStatusRepositoryStub({
      responses: [MAINTENANCE_STATUS, null],
      onFindServiceStatus() {
        capturedLoadCount += 1;
      },
    });
    const cache = new ServiceSettingsCache(repository, clock.now);

    await cache.getServiceStatus();
    clock.advance(SERVICE_SETTINGS_CACHE_TTL_MS);
    const result = await cache.getServiceStatus();

    expect(capturedLoadCount).toBe(2);
    expect(result.maintenanceEnabled).toBe(false);
  });

  it('invalidate 후에는 TTL 안이라도 DB를 다시 읽는다', async () => {
    let capturedLoadCount = 0;
    const repository = createServiceStatusRepositoryStub({
      onFindServiceStatus() {
        capturedLoadCount += 1;
      },
    });
    const cache = new ServiceSettingsCache(repository, createManualClock(0).now);

    await cache.getServiceStatus();
    cache.invalidate();
    await cache.getServiceStatus();

    expect(capturedLoadCount).toBe(2);
  });

  it('조회 중에 동시에 들어온 요청은 같은 조회 결과를 기다린다', async () => {
    let capturedLoadCount = 0;
    const repository = createServiceStatusRepositoryStub({
      onFindServiceStatus() {
        capturedLoadCount += 1;
      },
    });
    const cache = new ServiceSettingsCache(repository, createManualClock(0).now);

    const results = await Promise.all([cache.getServiceStatus(), cache.getServiceStatus(), cache.getServiceStatus()]);

    expect(capturedLoadCount).toBe(1);
    expect(results).toEqual([MAINTENANCE_STATUS, MAINTENANCE_STATUS, MAINTENANCE_STATUS]);
  });

  it('조회에 실패하면 실패를 캐시하지 않고 다음 요청에서 다시 읽는다', async () => {
    const repository = createServiceStatusRepositoryStub({ responses: [new Error('DB 연결 실패'), MAINTENANCE_STATUS] });
    const cache = new ServiceSettingsCache(repository, createManualClock(0).now);

    await expect(cache.getServiceStatus()).rejects.toThrow('DB 연결 실패');
    const result = await cache.getServiceStatus();

    expect(result).toEqual(MAINTENANCE_STATUS);
  });
});

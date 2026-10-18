import { Inject, Injectable, Optional } from '@nestjs/common';

import { SERVICE_STATUS_REPOSITORY, type ServiceStatusRepository } from './repositories/service-status.repository';
import { DEFAULT_SERVICE_STATUS, type ServiceStatus } from './types/service-status.type';

/** 점검 미들웨어가 요청마다 DB를 읽지 않도록 설정을 이 시간만큼 메모리에 둔다. */
export const SERVICE_SETTINGS_CACHE_TTL_MS = 10_000;

/** 테스트에서 시간을 직접 움직이려고 현재 시각(ms)을 주입받는다. 등록하지 않으면 Date.now를 쓴다. */
export const SERVICE_SETTINGS_CLOCK = Symbol('SERVICE_SETTINGS_CLOCK');

export type ServiceSettingsClock = () => number;

type CachedServiceStatus = {
  value: Promise<ServiceStatus>;
  expiresAt: number;
};

/**
 * 서비스 설정을 10초 동안 메모리에 캐시하는 읽기 전용 provider.
 * 점검 미들웨어와 공개 GET /service-status가 함께 쓰고, 어드민 설정 변경 직후 invalidate()로 비운다.
 * 캐시는 프로세스마다 따로라 다른 인스턴스에는 최대 TTL만큼 늦게 반영된다.
 */
@Injectable()
export class ServiceSettingsCache {
  private cached: CachedServiceStatus | null = null;

  constructor(
    @Inject(SERVICE_STATUS_REPOSITORY)
    private readonly serviceStatusRepository: ServiceStatusRepository,
    @Optional()
    @Inject(SERVICE_SETTINGS_CLOCK)
    private readonly now: ServiceSettingsClock = () => Date.now(),
  ) {}

  /**
   * 캐시된 서비스 상태를 돌려준다. 만료됐거나 비어 있으면 DB에서 다시 읽는다.
   * 만료 직후 동시에 들어온 요청이 각자 DB를 읽지 않도록 조회 중인 Promise 자체를 캐시한다.
   *
   * @returns {Promise<ServiceStatus>} 서비스 상태. 설정 행이 없으면 기본값
   */
  getServiceStatus(): Promise<ServiceStatus> {
    const currentTime = this.now();
    if (this.cached !== null && currentTime < this.cached.expiresAt) {
      return this.cached.value;
    }

    const loading = this.loadServiceStatus();
    const entry: CachedServiceStatus = { value: loading, expiresAt: currentTime + SERVICE_SETTINGS_CACHE_TTL_MS };
    this.cached = entry;

    // 조회에 실패한 결과를 TTL 동안 들고 있지 않도록 비운다. 그 사이 새로 채워진 캐시는 건드리지 않는다.
    loading.catch(() => {
      if (this.cached === entry) {
        this.cached = null;
      }
    });

    return loading;
  }

  /** 설정이 바뀐 직후 같은 프로세스가 옛 값을 쓰지 않도록 캐시를 비운다. */
  invalidate(): void {
    this.cached = null;
  }

  private async loadServiceStatus(): Promise<ServiceStatus> {
    const serviceStatus = await this.serviceStatusRepository.findServiceStatus();
    if (serviceStatus === null) {
      return { ...DEFAULT_SERVICE_STATUS };
    }

    return serviceStatus;
  }
}

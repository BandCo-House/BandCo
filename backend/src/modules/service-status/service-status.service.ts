import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from 'src/generated/prisma';

import { SERVICE_STATUS_REPOSITORY, type ServiceStatusRepository } from './repositories/service-status.repository';
import { type ActiveAnnouncement, DEFAULT_SERVICE_STATUS, type ServiceStatus } from './types/service-status.type';
import { ServiceSettingsCache } from './service-settings-cache';

@Injectable()
export class ServiceStatusService {
  constructor(
    @Inject(SERVICE_STATUS_REPOSITORY)
    private readonly serviceStatusRepository: ServiceStatusRepository,
    private readonly serviceSettingsCache: ServiceSettingsCache,
  ) {}

  /**
   * 앱이 시작할 때 확인하는 점검 여부·최소 버전을 조회한다.
   * 평소에는 점검 미들웨어와 같은 캐시를 읽어 두 판단이 어긋나지 않게 한다.
   * 상위 트랜잭션이 있으면 그 트랜잭션에서 보이는 값을 읽어야 하므로 캐시를 거치지 않는다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ServiceStatus>} 서비스 상태. 설정 행이 없으면 기본값
   */
  async getServiceStatus(tx?: Prisma.TransactionClient): Promise<ServiceStatus> {
    if (tx === undefined) {
      return this.serviceSettingsCache.getServiceStatus();
    }

    const serviceStatus = await this.serviceStatusRepository.findServiceStatus(tx);
    if (serviceStatus === null) {
      return { ...DEFAULT_SERVICE_STATUS };
    }

    return serviceStatus;
  }

  /**
   * 지금 노출 중인 공지를 최신순으로 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ announcements: ActiveAnnouncement[] }>} 노출 중인 공지
   */
  async getActiveAnnouncements(tx?: Prisma.TransactionClient): Promise<{ announcements: ActiveAnnouncement[] }> {
    const announcements = await this.serviceStatusRepository.findActiveAnnouncements(new Date(), tx);
    return { announcements };
  }
}

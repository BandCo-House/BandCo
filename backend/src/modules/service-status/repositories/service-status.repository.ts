import type { Prisma } from 'src/generated/prisma';

import type { ActiveAnnouncement, ServiceStatus } from '../types/service-status.type';

export const SERVICE_STATUS_REPOSITORY = Symbol('SERVICE_STATUS_REPOSITORY');

export interface ServiceStatusRepository {
  /**
   * 서비스 설정 행(id=1)을 공개 상태 형태로 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ServiceStatus | null>} 서비스 상태. 행이 없으면 null
   */
  findServiceStatus(tx?: Prisma.TransactionClient): Promise<ServiceStatus | null>;

  /**
   * 지금 노출 중인 공지를 최신순으로 조회한다.
   * 게시됨이고 시작 시각이 없거나 지났으며 종료 시각이 없거나 아직 오지 않은 공지다.
   *
   * @param {Date} now - 노출 여부 판정 기준 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ActiveAnnouncement[]>} 노출 중인 공지
   */
  findActiveAnnouncements(now: Date, tx?: Prisma.TransactionClient): Promise<ActiveAnnouncement[]>;
}

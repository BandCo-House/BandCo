import type { PaginationParams } from 'src/common/pagination';
import type { Prisma } from 'src/generated/prisma';

import type { AdminAnnouncement, CreateAnnouncementData, UpdateAnnouncementData } from '../types/admin-announcement.type';

export const ADMIN_ANNOUNCEMENTS_REPOSITORY = Symbol('ADMIN_ANNOUNCEMENTS_REPOSITORY');

export interface AdminAnnouncementsRepository {
  /**
   * 공지를 최신 생성순으로 한 페이지 조회한다.
   *
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ items: AdminAnnouncement[]; totalCount: number }>} 한 페이지와 전체 개수
   */
  findMany(pagination: PaginationParams, tx?: Prisma.TransactionClient): Promise<{ items: AdminAnnouncement[]; totalCount: number }>;

  /**
   * 공지 한 건을 조회한다.
   *
   * @param {string} announcementId - 공지 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminAnnouncement | null>} 공지. 없으면 null
   */
  findById(announcementId: string, tx?: Prisma.TransactionClient): Promise<AdminAnnouncement | null>;

  /**
   * 공지를 저장한다.
   *
   * @param {CreateAnnouncementData} data - 저장할 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminAnnouncement>} 생성된 공지
   */
  create(data: CreateAnnouncementData, tx?: Prisma.TransactionClient): Promise<AdminAnnouncement>;

  /**
   * 공지를 수정한다.
   *
   * @param {string} announcementId - 공지 ID
   * @param {UpdateAnnouncementData} data - 바꿀 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminAnnouncement>} 수정된 공지
   */
  update(announcementId: string, data: UpdateAnnouncementData, tx?: Prisma.TransactionClient): Promise<AdminAnnouncement>;

  /**
   * 공지를 삭제한다.
   *
   * @param {string} announcementId - 공지 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 삭제 완료
   */
  delete(announcementId: string, tx?: Prisma.TransactionClient): Promise<void>;
}

import type { Prisma } from 'src/generated/prisma';

import type { AdminSanctionRecord, CreateAdminSanctionRecordInput } from '../types/admin-sanction.type';

export const ADMIN_USER_SANCTIONS_REPOSITORY = Symbol('ADMIN_USER_SANCTIONS_REPOSITORY');

export interface AdminUserSanctionsRepository {
  /**
   * 회원 한 명의 제재 이력을 최신순으로 조회한다.
   *
   * @param {string} userId - 회원 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSanctionRecord[]>} 제재 이력
   */
  findSanctionsByUserId(userId: string, tx?: Prisma.TransactionClient): Promise<AdminSanctionRecord[]>;

  /**
   * 제재 한 건을 조회한다.
   *
   * @param {string} sanctionId - 제재 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSanctionRecord | null>} 제재, 없으면 null
   */
  findSanctionById(sanctionId: string, tx?: Prisma.TransactionClient): Promise<AdminSanctionRecord | null>;

  /**
   * 지금 효력이 있는 이용 정지가 있는지 확인한다.
   *
   * @param {string} userId - 회원 ID
   * @param {Date} now - 판정 기준 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<boolean>} 활성 정지 존재 여부
   */
  hasActiveSuspension(userId: string, now: Date, tx?: Prisma.TransactionClient): Promise<boolean>;

  /**
   * 제재를 저장한다.
   *
   * @param {CreateAdminSanctionRecordInput} input - 제재 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSanctionRecord>} 저장된 제재
   */
  createSanction(input: CreateAdminSanctionRecordInput, tx?: Prisma.TransactionClient): Promise<AdminSanctionRecord>;

  /**
   * 제재를 철회 처리한다.
   *
   * @param {string} sanctionId - 제재 ID
   * @param {string} revokedByAdminId - 철회한 어드민 ID
   * @param {Date} revokedAt - 철회 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSanctionRecord>} 철회된 제재
   */
  revokeSanction(sanctionId: string, revokedByAdminId: string, revokedAt: Date, tx?: Prisma.TransactionClient): Promise<AdminSanctionRecord>;
}

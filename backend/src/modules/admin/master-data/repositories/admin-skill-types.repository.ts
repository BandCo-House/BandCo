import type { Prisma } from 'src/generated/prisma';

import type { AdminSkillTypeItem } from '../types/admin-master-data.type';

export const ADMIN_SKILL_TYPES_REPOSITORY = Symbol('ADMIN_SKILL_TYPES_REPOSITORY');

export interface AdminSkillTypesRepository {
  /**
   * 세션 전체를 sortOrder, name 순으로 사용 횟수와 함께 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSkillTypeItem[]>} 세션 목록
   */
  findSkillTypes(tx?: Prisma.TransactionClient): Promise<AdminSkillTypeItem[]>;

  /**
   * 세션 한 건을 사용 횟수와 함께 조회한다.
   *
   * @param {string} skillTypeId - 세션 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSkillTypeItem | null>} 세션 또는 null
   */
  findSkillTypeById(skillTypeId: string, tx?: Prisma.TransactionClient): Promise<AdminSkillTypeItem | null>;

  /**
   * 이름이 정확히 같은 세션의 ID를 조회한다. 이름 중복 검사용이다.
   *
   * @param {string} name - 세션 이름
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string } | null>} 세션 ID 또는 null
   */
  findSkillTypeIdByName(name: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /**
   * 가장 큰 sortOrder를 조회한다. 세션이 하나도 없으면 null이다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<number | null>} 최대 sortOrder 또는 null
   */
  findMaxSkillTypeSortOrder(tx?: Prisma.TransactionClient): Promise<number | null>;

  /**
   * 세션을 만든다.
   *
   * @param {{ name: string; sortOrder: number }} data - 생성 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSkillTypeItem>} 생성된 세션
   */
  createSkillType(data: { name: string; sortOrder: number }, tx?: Prisma.TransactionClient): Promise<AdminSkillTypeItem>;

  /**
   * 세션 이름·순서를 바꾼다. undefined인 필드는 그대로 둔다.
   *
   * @param {string} skillTypeId - 세션 ID
   * @param {{ name?: string; sortOrder?: number }} data - 변경 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSkillTypeItem>} 수정된 세션
   */
  updateSkillType(skillTypeId: string, data: { name?: string; sortOrder?: number }, tx?: Prisma.TransactionClient): Promise<AdminSkillTypeItem>;

  /**
   * 세션을 삭제한다.
   *
   * @param {string} skillTypeId - 세션 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 삭제 완료
   */
  deleteSkillType(skillTypeId: string, tx?: Prisma.TransactionClient): Promise<void>;
}

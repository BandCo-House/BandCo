import type { Prisma } from '../../../generated/prisma';
import type { GenreListResult } from '../types/genre-list.type';
import type { SkillTypeListResult } from '../types/skill-type-list.type';

export const COMMON_REPOSITORY = Symbol('COMMON_REPOSITORY');

export interface CommonRepository {
  /**
   * 장르 전체 목록을 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GenreListResult>} 장르 목록
   */
  findAllGenres(tx?: Prisma.TransactionClient): Promise<GenreListResult>;

  /**
   * 스킬 타입 전체 목록을 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SkillTypeListResult>} 스킬 타입 목록
   */
  findAllSkillTypes(tx?: Prisma.TransactionClient): Promise<SkillTypeListResult>;
}

import type { Prisma } from 'src/generated/prisma';

import type { AdminGenreItem } from '../types/admin-master-data.type';

export const ADMIN_GENRES_REPOSITORY = Symbol('ADMIN_GENRES_REPOSITORY');

export interface AdminGenresRepository {
  /**
   * 장르 전체를 sortOrder, name 순으로 사용 횟수와 함께 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminGenreItem[]>} 장르 목록
   */
  findGenres(tx?: Prisma.TransactionClient): Promise<AdminGenreItem[]>;

  /**
   * 장르 한 건을 사용 횟수와 함께 조회한다.
   *
   * @param {string} genreId - 장르 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminGenreItem | null>} 장르 또는 null
   */
  findGenreById(genreId: string, tx?: Prisma.TransactionClient): Promise<AdminGenreItem | null>;

  /**
   * 이름이 정확히 같은 장르의 ID를 조회한다. 이름 중복 검사용이다.
   *
   * @param {string} name - 장르 이름
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string } | null>} 장르 ID 또는 null
   */
  findGenreIdByName(name: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /**
   * 가장 큰 sortOrder를 조회한다. 장르가 하나도 없으면 null이다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<number | null>} 최대 sortOrder 또는 null
   */
  findMaxGenreSortOrder(tx?: Prisma.TransactionClient): Promise<number | null>;

  /**
   * 장르를 만든다.
   *
   * @param {{ name: string; sortOrder: number }} data - 생성 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminGenreItem>} 생성된 장르
   */
  createGenre(data: { name: string; sortOrder: number }, tx?: Prisma.TransactionClient): Promise<AdminGenreItem>;

  /**
   * 장르 이름·순서를 바꾼다. undefined인 필드는 그대로 둔다.
   *
   * @param {string} genreId - 장르 ID
   * @param {{ name?: string; sortOrder?: number }} data - 변경 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminGenreItem>} 수정된 장르
   */
  updateGenre(genreId: string, data: { name?: string; sortOrder?: number }, tx?: Prisma.TransactionClient): Promise<AdminGenreItem>;

  /**
   * 장르를 삭제한다.
   *
   * @param {string} genreId - 장르 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 삭제 완료
   */
  deleteGenre(genreId: string, tx?: Prisma.TransactionClient): Promise<void>;
}

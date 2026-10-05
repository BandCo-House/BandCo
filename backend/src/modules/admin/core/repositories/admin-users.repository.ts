import type { AdminRole, Prisma } from 'src/generated/prisma';

export const ADMIN_USERS_REPOSITORY = Symbol('ADMIN_USERS_REPOSITORY');

export type AdminUserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  createdAt: Date;
};

export type CreateAdminUserData = {
  email: string;
  passwordHash: string;
  name: string;
  role: AdminRole;
};

export type UpdateAdminUserData = {
  name?: string;
  role?: AdminRole;
  isActive?: boolean;
  passwordHash?: string;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
};

export interface AdminUsersRepository {
  /**
   * ID로 어드민 계정을 조회한다. 비활성 계정도 반환한다.
   *
   * @param {string} id - 어드민 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminUserRecord | null>} 어드민 계정
   */
  findById(id: string, tx?: Prisma.TransactionClient): Promise<AdminUserRecord | null>;

  /**
   * 이메일로 어드민 계정을 조회한다. 비활성 계정도 반환한다.
   *
   * @param {string} email - 소문자로 정규화된 이메일
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminUserRecord | null>} 어드민 계정
   */
  findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<AdminUserRecord | null>;

  /**
   * 어드민 계정 전체를 생성순으로 조회한다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminUserRecord[]>} 어드민 계정 목록
   */
  findAll(tx?: Prisma.TransactionClient): Promise<AdminUserRecord[]>;

  /**
   * 어드민 계정을 생성한다.
   *
   * @param {CreateAdminUserData} data - 해시가 끝난 생성 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminUserRecord>} 생성된 계정
   */
  create(data: CreateAdminUserData, tx?: Prisma.TransactionClient): Promise<AdminUserRecord>;

  /**
   * 어드민 계정을 수정한다.
   *
   * @param {string} id - 어드민 ID
   * @param {UpdateAdminUserData} data - 변경할 값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminUserRecord>} 수정된 계정
   */
  update(id: string, data: UpdateAdminUserData, tx?: Prisma.TransactionClient): Promise<AdminUserRecord>;
}

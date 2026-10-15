import type { PaginationParams } from 'src/common/pagination';
import type { Prisma, UserStatus } from 'src/generated/prisma';

import type { AdminUserDetail, AdminUserListFilter, AdminUserListItem, AdminUserState } from '../types/admin-user.type';

/** 서비스 회원(users)을 어드민이 관리할 때 쓰는 저장소. 어드민 계정(admin_users) 저장소와 구분한다. */
export const ADMIN_MANAGED_USERS_REPOSITORY = Symbol('ADMIN_MANAGED_USERS_REPOSITORY');

export interface AdminManagedUsersRepository {
  /**
   * 조건에 맞는 회원을 가입 최신순으로 한 페이지 조회한다.
   *
   * @param {AdminUserListFilter} filter - 키워드·상태 필터
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Date} now - 활성 정지 판정 기준 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ items: AdminUserListItem[]; totalCount: number }>} 한 페이지와 전체 개수
   */
  findUsers(
    filter: AdminUserListFilter,
    pagination: PaginationParams,
    now: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminUserListItem[]; totalCount: number }>;

  /**
   * 탈퇴 여부와 관계없이 회원 상세를 조회한다.
   *
   * @param {string} userId - 회원 ID
   * @param {Date} now - 활성 정지 판정 기준 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminUserDetail | null>} 회원 상세, 없으면 null
   */
  findUserDetail(userId: string, now: Date, tx?: Prisma.TransactionClient): Promise<AdminUserDetail | null>;

  /**
   * 쓰기 작업 전 검증용으로 회원의 상태와 탈퇴 여부를 조회한다.
   *
   * @param {string} userId - 회원 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminUserState | null>} 회원 상태, 없으면 null
   */
  findUserState(userId: string, tx?: Prisma.TransactionClient): Promise<AdminUserState | null>;

  /**
   * 회원 상태를 바꾼다.
   *
   * @param {string} userId - 회원 ID
   * @param {UserStatus} status - 바꿀 상태
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 변경 완료
   */
  updateUserStatus(userId: string, status: UserStatus, tx?: Prisma.TransactionClient): Promise<void>;

  /**
   * 회원을 탈퇴 처리한다. 유저 탈퇴 API와 같게 deletedAt을 기록하고 상태를 INACTIVE로 둔다.
   *
   * @param {string} userId - 회원 ID
   * @param {Date} deletedAt - 탈퇴 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 변경 완료
   */
  softDeleteUser(userId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<void>;

  /**
   * 어드민이 탈퇴 처리하기 직전의 회원 상태를 조회한다.
   * 탈퇴 처리 감사 로그(USER_WITHDRAW)에 남긴 이전 상태 중 지금의 deletedAt과 같은 탈퇴 건만 본다.
   * 유저가 직접 탈퇴했거나 기록이 없으면 null이다.
   *
   * @param {string} userId - 회원 ID
   * @param {Date} deletedAt - 현재 탈퇴 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UserStatus | null>} 탈퇴 직전 상태
   */
  findStatusBeforeAdminWithdrawal(userId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<UserStatus | null>;

  /**
   * 탈퇴한 회원을 복구한다. deletedAt을 비우고 상태를 지정한 값으로 되돌린다.
   *
   * @param {string} userId - 회원 ID
   * @param {UserStatus} status - 복구 후 상태
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 변경 완료
   */
  restoreUser(userId: string, status: UserStatus, tx?: Prisma.TransactionClient): Promise<void>;

  /**
   * users 행을 잠근다(SELECT … FOR UPDATE). 같은 회원에게 동시에 이용 정지를 겹쳐 내리지 않게 할 때 쓴다.
   * 트랜잭션 밖에서 잠그면 즉시 풀려 의미가 없어 tx를 필수로 받는다.
   *
   * @param {string} userId - 회원 ID
   * @param {Prisma.TransactionClient} tx - 상위 트랜잭션 client
   * @returns {Promise<void>} 잠금 완료
   */
  lockUserForSanction(userId: string, tx: Prisma.TransactionClient): Promise<void>;
}

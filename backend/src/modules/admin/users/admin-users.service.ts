import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { PaginationParams } from 'src/common/pagination';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import { type AdminPaginatedResult, toAdminPaginatedResult } from '../core/types/admin-paginated.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { ADMIN_MANAGED_USERS_REPOSITORY, type AdminManagedUsersRepository } from './repositories/admin-managed-users.repository';
import type {
  AdminUserDetail,
  AdminUserListFilter,
  AdminUserListItem,
  AdminUserState,
  RestoreAdminUserResult,
  UpdateAdminUserStatusInput,
  UpdateAdminUserStatusResult,
  WithdrawAdminUserResult,
} from './types/admin-user.type';

@Injectable()
export class AdminUsersService {
  constructor(
    @Inject(ADMIN_MANAGED_USERS_REPOSITORY)
    private readonly managedUsersRepository: AdminManagedUsersRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 회원 목록을 가입 최신순으로 조회한다.
   *
   * @param {AdminUserListFilter} filter - 키워드·상태 필터
   * @param {PaginationParams} pagination - 페이지 정보
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminPaginatedResult<AdminUserListItem>>} 회원 목록
   */
  async getUsers(
    filter: AdminUserListFilter,
    pagination: PaginationParams,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminPaginatedResult<AdminUserListItem>> {
    const { items, totalCount } = await this.managedUsersRepository.findUsers(filter, pagination, new Date(), tx);
    return toAdminPaginatedResult(items, totalCount, pagination);
  }

  /**
   * 회원 상세를 조회한다. 탈퇴한 회원도 운영 확인을 위해 조회할 수 있다.
   *
   * @param {string} userId - 회원 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminUserDetail>} 회원 상세
   */
  async getUserDetail(userId: string, tx?: Prisma.TransactionClient): Promise<AdminUserDetail> {
    const detail = await this.managedUsersRepository.findUserDetail(userId, new Date(), tx);
    if (detail === null) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    return detail;
  }

  /**
   * 회원 상태(ACTIVE/INACTIVE)를 바꾼다. 탈퇴 회원은 복구가 먼저라 상태 변경을 막는다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} userId - 회원 ID
   * @param {UpdateAdminUserStatusInput} input - 바꿀 상태와 사유
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateAdminUserStatusResult>} 변경된 상태
   */
  async updateUserStatus(
    actor: AdminPrincipal,
    userId: string,
    input: UpdateAdminUserStatusInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateAdminUserStatusResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdateAdminUserStatusResult> => {
      const user = await this.findUserStateOrThrow(userId, client);
      if (user.deletedAt !== null) {
        throw new BadRequestException('탈퇴한 회원은 상태를 바꿀 수 없습니다.');
      }
      if (user.status === input.status) {
        throw new BadRequestException('이미 같은 상태인 회원입니다.');
      }

      await this.managedUsersRepository.updateUserStatus(userId, input.status, client);
      await this.auditLogsService.record(
        {
          adminUserId: actor.id,
          action: 'USER_STATUS_UPDATE',
          targetType: 'USER',
          targetId: userId,
          detail: { from: user.status, to: input.status, reason: input.reason ?? null },
        },
        client,
      );

      return { userId, status: input.status };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 회원을 탈퇴 처리한다. 유저가 직접 탈퇴할 때와 같은 상태(deletedAt 기록, INACTIVE)로 만든다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} userId - 회원 ID
   * @param {string | undefined} reason - 처리 사유
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<WithdrawAdminUserResult>} 탈퇴 시각
   */
  async withdrawUser(
    actor: AdminPrincipal,
    userId: string,
    reason: string | undefined,
    tx?: Prisma.TransactionClient,
  ): Promise<WithdrawAdminUserResult> {
    const run = async (client: Prisma.TransactionClient): Promise<WithdrawAdminUserResult> => {
      const user = await this.findUserStateOrThrow(userId, client);
      if (user.deletedAt !== null) {
        throw new BadRequestException('이미 탈퇴한 회원입니다.');
      }

      const deletedAt = new Date();
      await this.managedUsersRepository.softDeleteUser(userId, deletedAt, client);
      await this.auditLogsService.record(
        { adminUserId: actor.id, action: 'USER_WITHDRAW', targetType: 'USER', targetId: userId, detail: { reason: reason ?? null } },
        client,
      );

      return { userId, deletedAt: deletedAt.toISOString() };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 탈퇴한 회원을 복구한다. 이메일은 탈퇴 후에도 그대로 남아 있어 복구 시 중복 충돌이 없다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} userId - 회원 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<RestoreAdminUserResult>} 복구 결과
   */
  async restoreUser(actor: AdminPrincipal, userId: string, tx?: Prisma.TransactionClient): Promise<RestoreAdminUserResult> {
    const run = async (client: Prisma.TransactionClient): Promise<RestoreAdminUserResult> => {
      const user = await this.findUserStateOrThrow(userId, client);
      if (user.deletedAt === null) {
        throw new BadRequestException('탈퇴하지 않은 회원입니다.');
      }

      await this.managedUsersRepository.restoreUser(userId, client);
      await this.auditLogsService.record({ adminUserId: actor.id, action: 'USER_RESTORE', targetType: 'USER', targetId: userId }, client);

      return { userId, deletedAt: null };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  private async findUserStateOrThrow(userId: string, client: Prisma.TransactionClient): Promise<AdminUserState> {
    const user = await this.managedUsersRepository.findUserState(userId, client);
    if (user === null) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    return user;
  }
}

import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { ADMIN_MANAGED_USERS_REPOSITORY, type AdminManagedUsersRepository } from './repositories/admin-managed-users.repository';
import { ADMIN_USER_NOTIFICATIONS_REPOSITORY, type AdminUserNotificationsRepository } from './repositories/admin-user-notifications.repository';
import { ADMIN_USER_SANCTIONS_REPOSITORY, type AdminUserSanctionsRepository } from './repositories/admin-user-sanctions.repository';
import type { AdminSanction, AdminSanctionRecord, CreateAdminSanctionInput } from './types/admin-sanction.type';

/** 경고 제재와 함께 회원에게 보내는 알림 제목 */
export const SANCTION_WARNING_NOTICE_TITLE = '운영 정책 위반 경고';

/**
 * 제재가 지금 효력이 있는지 판정한다. buildActiveSuspensionWhere와 같은 기준이다.
 * 경고는 접근을 막지 않으므로 항상 비활성이다.
 *
 * @param {AdminSanctionRecord} record - 제재
 * @param {Date} now - 판정 기준 시각
 * @returns {boolean} 효력 여부
 */
function isSanctionActive(record: AdminSanctionRecord, now: Date): boolean {
  if (record.type !== 'SUSPENSION') {
    return false;
  }
  if (record.revokedAt !== null) {
    return false;
  }
  if (record.endsAt === null) {
    return true;
  }

  return record.endsAt.getTime() > now.getTime();
}

function toAdminSanction(record: AdminSanctionRecord, now: Date): AdminSanction {
  return {
    sanctionId: record.sanctionId,
    userId: record.userId,
    type: record.type,
    reason: record.reason,
    endsAt: record.endsAt?.toISOString() ?? null,
    isActive: isSanctionActive(record, now),
    createdAt: record.createdAt.toISOString(),
    createdBy: record.createdBy,
    revokedAt: record.revokedAt?.toISOString() ?? null,
    revokedBy: record.revokedBy,
  };
}

@Injectable()
export class AdminSanctionsService {
  constructor(
    @Inject(ADMIN_USER_SANCTIONS_REPOSITORY)
    private readonly sanctionsRepository: AdminUserSanctionsRepository,
    @Inject(ADMIN_MANAGED_USERS_REPOSITORY)
    private readonly managedUsersRepository: AdminManagedUsersRepository,
    @Inject(ADMIN_USER_NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository: AdminUserNotificationsRepository,
    private readonly auditLogsService: AdminAuditLogsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 회원 한 명의 제재 이력을 최신순으로 조회한다. 탈퇴 회원의 이력도 확인할 수 있다.
   *
   * @param {string} userId - 회원 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ sanctions: AdminSanction[] }>} 제재 이력
   */
  async getUserSanctions(userId: string, tx?: Prisma.TransactionClient): Promise<{ sanctions: AdminSanction[] }> {
    const user = await this.managedUsersRepository.findUserState(userId, tx);
    if (user === null) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    const records = await this.sanctionsRepository.findSanctionsByUserId(userId, tx);
    const now = new Date();
    return { sanctions: records.map(record => toAdminSanction(record, now)) };
  }

  /**
   * 회원에게 경고 또는 이용 정지를 내린다.
   * 정지는 동시에 하나만 유효하게 두어 해제 시점이 헷갈리지 않게 한다.
   * 경고는 회원이 알 수 있도록 NOTICE 알림을 함께 보낸다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} userId - 회원 ID
   * @param {CreateAdminSanctionInput} input - 제재 종류·사유·종료 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSanction>} 생성된 제재
   */
  async createSanction(
    actor: AdminPrincipal,
    userId: string,
    input: CreateAdminSanctionInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AdminSanction> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminSanction> => {
      const now = new Date();
      const isWarning = input.type === 'WARNING';

      // 종료 시각이 없으면 영구 정지다. 본문에 null로 보내도 지정하지 않은 것으로 본다.
      const requestedEndsAt = input.endsAt ?? null;
      let endsAt: Date | null = null;
      if (requestedEndsAt !== null) {
        if (isWarning) {
          throw new BadRequestException('경고에는 종료 시각을 지정할 수 없습니다.');
        }
        endsAt = new Date(requestedEndsAt);
        if (endsAt.getTime() <= now.getTime()) {
          throw new BadRequestException('정지 종료 시각은 현재 이후여야 합니다.');
        }
      }

      const user = await this.managedUsersRepository.findUserState(userId, client);
      if (user === null || user.deletedAt !== null) {
        throw new NotFoundException('회원을 찾을 수 없습니다.');
      }

      if (!isWarning) {
        const hasActiveSuspension = await this.sanctionsRepository.hasActiveSuspension(userId, now, client);
        if (hasActiveSuspension) {
          throw new ConflictException('이미 이용 정지 중인 회원입니다.');
        }
      }

      const created = await this.sanctionsRepository.createSanction(
        { userId, type: input.type, reason: input.reason, endsAt, createdByAdminId: actor.id },
        client,
      );

      if (isWarning) {
        await this.notificationsRepository.createNotification(
          {
            userId,
            type: 'NOTICE',
            title: SANCTION_WARNING_NOTICE_TITLE,
            description: input.reason,
            targetPath: null,
            referenceType: null,
            referenceId: null,
          },
          client,
        );
      }

      await this.auditLogsService.record(
        {
          adminUserId: actor.id,
          action: 'SANCTION_CREATE',
          targetType: 'USER',
          targetId: userId,
          detail: { sanctionId: created.sanctionId, type: input.type, endsAt: endsAt?.toISOString() ?? null },
        },
        client,
      );

      return toAdminSanction(created, now);
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 이용 정지를 철회한다. 경고는 효력이 없는 기록이라 철회 대상이 아니다.
   *
   * @param {AdminPrincipal} actor - 요청한 어드민
   * @param {string} sanctionId - 제재 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminSanction>} 철회된 제재
   */
  async revokeSanction(actor: AdminPrincipal, sanctionId: string, tx?: Prisma.TransactionClient): Promise<AdminSanction> {
    const run = async (client: Prisma.TransactionClient): Promise<AdminSanction> => {
      const sanction = await this.sanctionsRepository.findSanctionById(sanctionId, client);
      if (sanction === null) {
        throw new NotFoundException('제재를 찾을 수 없습니다.');
      }
      if (sanction.type === 'WARNING') {
        throw new BadRequestException('경고는 철회할 수 없습니다.');
      }
      if (sanction.revokedAt !== null) {
        throw new BadRequestException('이미 철회된 제재입니다.');
      }

      const now = new Date();
      const revoked = await this.sanctionsRepository.revokeSanction(sanctionId, actor.id, now, client);
      await this.auditLogsService.record(
        { adminUserId: actor.id, action: 'SANCTION_REVOKE', targetType: 'SANCTION', targetId: sanctionId, detail: { userId: sanction.userId } },
        client,
      );

      return toAdminSanction(revoked, now);
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }
}

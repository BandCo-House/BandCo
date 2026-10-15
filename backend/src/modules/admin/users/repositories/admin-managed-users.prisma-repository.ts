import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import type { PaginationParams } from 'src/common/pagination';
import { buildActiveSuspensionWhere } from 'src/common/sanction/active-suspension.where';
import { PrismaService } from 'src/database/prisma';
import type { Prisma, UserStatus } from 'src/generated/prisma';

import { toSkipTake } from '../../core/types/admin-paginated.type';
import type { AdminUserDetail, AdminUserListFilter, AdminUserListItem, AdminUserState, AdminUserStatusFilter } from '../types/admin-user.type';

import type { AdminManagedUsersRepository } from './admin-managed-users.repository';

/**
 * 목록·상세가 함께 쓰는 회원 select.
 * 활성 정지 판정이 기준 시각에 따라 달라져 함수로 만든다.
 */
function buildUserListSelect(now: Date) {
  return {
    id: true,
    email: true,
    passwordHash: true,
    status: true,
    createdAt: true,
    lastLoginAt: true,
    deletedAt: true,
    profile: { select: { nickname: true, avatarUrl: true } },
    oauthAccounts: { select: { provider: true } },
    // 삭제된 밴드는 회원이 실제로 활동하는 밴드가 아니라서 밴드 수에서 뺀다
    _count: { select: { bandMemberships: { where: { band: { deletedAt: null } } } } },
    sanctions: { where: buildActiveSuspensionWhere(now), select: { id: true }, take: 1 },
  } satisfies Prisma.UserSelect;
}

type UserListRow = Prisma.UserGetPayload<{ select: ReturnType<typeof buildUserListSelect> }>;

/**
 * 키워드는 이메일·닉네임 부분일치, UUID 형식이면 ID 일치까지 OR로 묶는다.
 */
function buildKeywordWhere(keyword: string): Prisma.UserWhereInput {
  const conditions: Prisma.UserWhereInput[] = [
    { email: { contains: keyword, mode: 'insensitive' } },
    { profile: { nickname: { contains: keyword, mode: 'insensitive' } } },
  ];

  if (isUUID(keyword)) {
    conditions.push({ id: keyword });
  }

  return { OR: conditions };
}

/**
 * 상태 필터를 where 조건으로 바꾼다. 탈퇴 회원은 DELETED에서만 보이게 나머지는 deletedAt: null을 건다.
 */
function buildStatusWhere(status: AdminUserStatusFilter, now: Date): Prisma.UserWhereInput {
  const activeSuspensionWhere = buildActiveSuspensionWhere(now);

  switch (status) {
    case 'ACTIVE':
      return { deletedAt: null, status: 'ACTIVE', sanctions: { none: activeSuspensionWhere } };
    case 'INACTIVE':
      return { deletedAt: null, status: 'INACTIVE' };
    case 'SUSPENDED':
      return { deletedAt: null, sanctions: { some: activeSuspensionWhere } };
    case 'DELETED':
      return { deletedAt: { not: null } };
  }
}

function toAdminUserListItem(row: UserListRow): AdminUserListItem {
  // 같은 provider 계정이 여러 개 연결돼 있어도 목록에는 한 번만 보여준다
  const providers = Array.from(new Set(row.oauthAccounts.map(account => account.provider)));

  return {
    userId: row.id,
    email: row.email,
    nickname: row.profile?.nickname ?? null,
    avatarUrl: row.profile?.avatarUrl ?? null,
    status: row.status,
    isDeleted: row.deletedAt !== null,
    isSuspended: row.sanctions.length > 0,
    providers,
    hasPassword: row.passwordHash !== null,
    bandCount: row._count.bandMemberships,
    createdAt: row.createdAt.toISOString(),
    lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

@Injectable()
export class AdminManagedUsersPrismaRepository implements AdminManagedUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUsers(
    filter: AdminUserListFilter,
    pagination: PaginationParams,
    now: Date,
    tx?: Prisma.TransactionClient,
  ): Promise<{ items: AdminUserListItem[]; totalCount: number }> {
    const client = tx ?? this.prisma;
    const conditions: Prisma.UserWhereInput[] = [];
    if (filter.keyword !== undefined) {
      conditions.push(buildKeywordWhere(filter.keyword));
    }
    if (filter.status !== undefined) {
      conditions.push(buildStatusWhere(filter.status, now));
    }
    const where: Prisma.UserWhereInput = { AND: conditions };

    const [rows, totalCount] = await Promise.all([
      client.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        ...toSkipTake(pagination),
        select: buildUserListSelect(now),
      }),
      client.user.count({ where }),
    ]);

    return { items: rows.map(toAdminUserListItem), totalCount };
  }

  async findUserDetail(userId: string, now: Date, tx?: Prisma.TransactionClient): Promise<AdminUserDetail | null> {
    const client = tx ?? this.prisma;
    const row = await client.user.findUnique({
      where: { id: userId },
      select: {
        ...buildUserListSelect(now),
        profile: { select: { nickname: true, avatarUrl: true, selfDescription: true } },
        oauthAccounts: { select: { provider: true, email: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
        // 같은 정지가 여러 건 겹치면 가장 최근에 내린 정지를 보여준다
        sanctions: {
          where: buildActiveSuspensionWhere(now),
          select: { id: true, reason: true, endsAt: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        bandMemberships: {
          select: { role: true, joinedAt: true, band: { select: { id: true, name: true, deletedAt: true } } },
          orderBy: { joinedAt: 'desc' },
        },
        _count: {
          select: {
            bandMemberships: { where: { band: { deletedAt: null } } },
            reportsReceived: true,
            reportsMade: true,
          },
        },
      },
    });

    if (row === null) {
      return null;
    }

    const activeSuspension = row.sanctions[0];

    return {
      ...toAdminUserListItem(row),
      selfDescription: row.profile?.selfDescription ?? null,
      oauthAccounts: row.oauthAccounts.map(account => ({
        provider: account.provider,
        email: account.email,
        createdAt: account.createdAt.toISOString(),
      })),
      bands: row.bandMemberships.map(membership => ({
        bandId: membership.band.id,
        name: membership.band.name,
        role: membership.role,
        joinedAt: membership.joinedAt.toISOString(),
        isDeleted: membership.band.deletedAt !== null,
      })),
      activeSuspension:
        activeSuspension === undefined
          ? null
          : {
              sanctionId: activeSuspension.id,
              reason: activeSuspension.reason,
              endsAt: activeSuspension.endsAt?.toISOString() ?? null,
              createdAt: activeSuspension.createdAt.toISOString(),
            },
      reportCounts: { received: row._count.reportsReceived, made: row._count.reportsMade },
    };
  }

  async findUserState(userId: string, tx?: Prisma.TransactionClient): Promise<AdminUserState | null> {
    const client = tx ?? this.prisma;
    const user = await client.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (user === null) {
      return null;
    }

    return { userId: user.id, status: user.status, deletedAt: user.deletedAt };
  }

  async updateUserStatus(userId: string, status: UserStatus, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.user.update({ where: { id: userId }, data: { status } });
  }

  async softDeleteUser(userId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.user.update({ where: { id: userId }, data: { deletedAt, status: 'INACTIVE' } });
  }

  async findStatusBeforeAdminWithdrawal(userId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<UserStatus | null> {
    const client = tx ?? this.prisma;
    // 탈퇴하면 상태가 INACTIVE로 덮어써져 이전 상태는 탈퇴 처리 감사 로그에만 남는다
    const withdrawalLog = await client.adminAuditLog.findFirst({
      where: {
        action: 'USER_WITHDRAW',
        targetType: 'USER',
        targetId: userId,
        detail: { path: ['deletedAt'], equals: deletedAt.toISOString() },
      },
      orderBy: { createdAt: 'desc' },
      select: { detail: true },
    });

    const previousStatus = (withdrawalLog?.detail as { previousStatus?: unknown } | null | undefined)?.previousStatus;
    return previousStatus === 'ACTIVE' || previousStatus === 'INACTIVE' ? previousStatus : null;
  }

  async restoreUser(userId: string, status: UserStatus, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx ?? this.prisma;
    await client.user.update({ where: { id: userId }, data: { deletedAt: null, status } });
  }

  async lockUserForSanction(userId: string, tx: Prisma.TransactionClient): Promise<void> {
    // Prisma 쿼리 API에는 행 잠금이 없어 raw로 건다. 태그드 템플릿이라 userId는 파라미터로 바인딩된다.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId}::uuid FOR UPDATE`;
  }
}

import { Injectable } from '@nestjs/common';
import { buildActiveSuspensionWhere } from 'src/common/sanction/active-suspension.where';
import { PrismaService } from 'src/database/prisma';
import type { Prisma } from 'src/generated/prisma';

import type {
  AdminDashboardFunnelCounts,
  AdminDashboardSummaryCounts,
  AdminDashboardSummaryCriteria,
  AdminDashboardUserIdentity,
} from '../types/admin-dashboard.type';

import type { AdminDashboardRepository } from './admin-dashboard.repository';

@Injectable()
export class AdminDashboardPrismaRepository implements AdminDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 대시보드 요약 숫자를 센다. 서로 독립된 count 쿼리라 병렬로 실행한다.
   *
   * @param {AdminDashboardSummaryCriteria} criteria - 집계 시각 경계
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminDashboardSummaryCounts>} 요약 숫자
   */
  async countSummary(criteria: AdminDashboardSummaryCriteria, tx?: Prisma.TransactionClient): Promise<AdminDashboardSummaryCounts> {
    const client = tx ?? this.prisma;
    const activeSuspensionWhere = buildActiveSuspensionWhere(criteria.now);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      deletedUsers,
      newUsersToday,
      newUsersLast7Days,
      newUsersLast30Days,
      dau,
      wau,
      mau,
      totalBands,
      activeBandsLast30Days,
      totalBandSpaces,
      totalSchedules,
      schedulesCreatedLast30Days,
      pendingReports,
    ] = await Promise.all([
      client.user.count({ where: { deletedAt: null } }),
      // 어드민 회원 목록의 ACTIVE 필터와 같은 기준: 탈퇴 안 함 + ACTIVE + 활성 정지 없음
      client.user.count({ where: { deletedAt: null, status: 'ACTIVE', sanctions: { none: activeSuspensionWhere } } }),
      client.user.count({ where: { deletedAt: null, status: 'INACTIVE' } }),
      client.user.count({ where: { deletedAt: null, sanctions: { some: activeSuspensionWhere } } }),
      client.user.count({ where: { deletedAt: { not: null } } }),
      // 신규 가입은 이후 탈퇴 여부와 관계없이 가입 사실 자체를 센다(가입 추이 차트와 같은 기준)
      client.user.count({ where: { createdAt: { gte: criteria.newUsersSince.today } } }),
      client.user.count({ where: { createdAt: { gte: criteria.newUsersSince.last7Days } } }),
      client.user.count({ where: { createdAt: { gte: criteria.newUsersSince.last30Days } } }),
      client.user.count({ where: { deletedAt: null, lastLoginAt: { gte: criteria.lastLoginSince.day } } }),
      client.user.count({ where: { deletedAt: null, lastLoginAt: { gte: criteria.lastLoginSince.week } } }),
      client.user.count({ where: { deletedAt: null, lastLoginAt: { gte: criteria.lastLoginSince.month } } }),
      client.band.count({ where: { deletedAt: null } }),
      client.band.count({
        where: {
          deletedAt: null,
          bandSpaces: { some: { schedules: { some: { createdAt: { gte: criteria.recentActivitySince } } } } },
        },
      }),
      client.bandSpace.count({ where: { deletedAt: null } }),
      client.schedule.count(),
      client.schedule.count({ where: { createdAt: { gte: criteria.recentActivitySince } } }),
      client.userReport.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        suspended: suspendedUsers,
        deleted: deletedUsers,
        newToday: newUsersToday,
        newLast7Days: newUsersLast7Days,
        newLast30Days: newUsersLast30Days,
      },
      activity: { dau, wau, mau },
      bands: { total: totalBands, activeLast30Days: activeBandsLast30Days },
      bandSpaces: { total: totalBandSpaces },
      schedules: { total: totalSchedules, createdLast30Days: schedulesCreatedLast30Days },
      reports: { pending: pendingReports },
    };
  }

  /**
   * 기준 시각 이후 가입한 유저의 가입 시각을 모두 조회한다. 탈퇴한 유저도 포함한다.
   *
   * @param {Date} since - 조회 시작 시각(이상)
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<Date[]>} 가입 시각 목록
   */
  async findUserCreatedAtsSince(since: Date, tx?: Prisma.TransactionClient): Promise<Date[]> {
    const client = tx ?? this.prisma;
    const users = await client.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });
    return users.map(user => user.createdAt);
  }

  /**
   * 기간 내 가입한 유저 코호트의 퍼널 단계별 인원을 센다.
   * 코호트는 탈퇴 여부와 관계없이 기간 내 가입한 모든 유저다.
   *
   * @param {Date} start - 코호트 가입 시각 시작(이상)
   * @param {Date} end - 코호트 가입 시각 끝(미만)
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminDashboardFunnelCounts>} 단계별 인원
   */
  async countFunnel(start: Date, end: Date, tx?: Prisma.TransactionClient): Promise<AdminDashboardFunnelCounts> {
    const client = tx ?? this.prisma;
    const cohortWhere: Prisma.UserWhereInput = { createdAt: { gte: start, lt: end } };

    const [signedUp, profileCompleted, joinedBand, createdSchedule] = await Promise.all([
      client.user.count({ where: cohortWhere }),
      client.user.count({ where: { ...cohortWhere, userSkills: { some: {} } } }),
      client.user.count({ where: { ...cohortWhere, bandMemberships: { some: {} } } }),
      client.user.count({ where: { ...cohortWhere, bandMemberships: { some: { createdSchedules: { some: {} } } } } }),
    ]);

    return {
      SIGNED_UP: signedUp,
      PROFILE_COMPLETED: profileCompleted,
      JOINED_BAND: joinedBand,
      CREATED_SCHEDULE: createdSchedule,
    };
  }

  /**
   * 유저 ID 목록의 닉네임·이메일을 조회한다. DB에 없는 ID는 결과에서 빠진다.
   *
   * @param {string[]} userIds - 조회할 유저 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminDashboardUserIdentity[]>} 유저 식별 정보
   */
  async findUserIdentities(userIds: string[], tx?: Prisma.TransactionClient): Promise<AdminDashboardUserIdentity[]> {
    const client = tx ?? this.prisma;
    const users = await client.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, profile: { select: { nickname: true } } },
    });
    return users.map(user => ({
      userId: user.id,
      nickname: user.profile?.nickname ?? null,
      email: user.email,
    }));
  }
}

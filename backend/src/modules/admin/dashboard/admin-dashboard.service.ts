import { BadRequestException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { Prisma } from 'src/generated/prisma';
import { StorageService } from 'src/storage/storage.service';

import { ADMIN_DASHBOARD_REPOSITORY, type AdminDashboardRepository } from './repositories/admin-dashboard.repository';
import {
  ADMIN_DASHBOARD_FUNNEL_STEPS,
  type AdminDashboardFunnel,
  type AdminDashboardFunnelRange,
  type AdminDashboardSignups,
  type AdminDashboardStorage,
  type AdminDashboardSummary,
  type AdminDashboardSummaryCriteria,
} from './types/admin-dashboard.type';
import { addDaysToDateString, countDaysInclusive, getKstDayStart, toKstDateString } from './utils/kst-date.util';

const DAY_MS = 24 * 60 * 60 * 1000;
/** 최근 활동(활성 밴드·최근 일정)을 보는 롤링 기간 */
const RECENT_ACTIVITY_DAYS = 30;
const DEFAULT_FUNNEL_DAYS = 30;
const MAX_FUNNEL_DAYS = 366;
const STORAGE_TOP_USER_LIMIT = 10;
/** StorageService.generateUploadUrl이 만드는 유저별 키 `users/{userId}/...` */
const USER_OBJECT_KEY_PATTERN = /^users\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\//i;

type UserStorageUsage = { userId: string; bytes: number; objectCount: number };

@Injectable()
export class AdminDashboardService {
  constructor(
    @Inject(ADMIN_DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: AdminDashboardRepository,
    private readonly storageService: StorageService,
  ) {}

  /**
   * 대시보드 요약 숫자를 만든다.
   * 신규 가입은 KST 달력 기준(오늘 포함 1/7/30일), DAU/WAU/MAU와 최근 30일 활동은 지금부터의 롤링 기간이다.
   * DAU/WAU/MAU는 users.last_login_at 기준이다. 이 값은 어드민 콘솔 배포부터 로그인·토큰 재발급 때 갱신되기
   * 시작했으므로 배포 직후에는 실제보다 작게 나온다.
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminDashboardSummary>} 요약 숫자
   */
  async getSummary(tx?: Prisma.TransactionClient): Promise<AdminDashboardSummary> {
    const now = new Date();
    const today = toKstDateString(now);

    const criteria: AdminDashboardSummaryCriteria = {
      now,
      newUsersSince: {
        today: getKstDayStart(today),
        last7Days: getKstDayStart(addDaysToDateString(today, -6)),
        last30Days: getKstDayStart(addDaysToDateString(today, -29)),
      },
      lastLoginSince: {
        day: new Date(now.getTime() - DAY_MS),
        week: new Date(now.getTime() - 7 * DAY_MS),
        month: new Date(now.getTime() - 30 * DAY_MS),
      },
      recentActivitySince: new Date(now.getTime() - RECENT_ACTIVITY_DAYS * DAY_MS),
    };

    const counts = await this.dashboardRepository.countSummary(criteria, tx);
    return { ...counts, generatedAt: now.toISOString() };
  }

  /**
   * 오늘(KST)을 포함한 최근 days일의 일별 가입 수를 오래된 순으로 만든다. 가입이 없는 날은 0으로 채운다.
   *
   * SQL `date_trunc('day', created_at AT TIME ZONE 'Asia/Seoul')` 집계 대신 가입 시각만 읽어 코드에서 센다.
   * users 테이블이 작고(최대 180일분) KST 날짜 계산을 순수 함수 하나로 모아 테스트할 수 있어서다.
   * 유저 수가 크게 늘면 SQL 집계로 바꾼다.
   *
   * @param {number} days - 조회 일수(1~180, DTO에서 검증)
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminDashboardSignups>} 일별 가입 수
   */
  async getSignups(days: number, tx?: Prisma.TransactionClient): Promise<AdminDashboardSignups> {
    const today = toKstDateString(new Date());
    const firstDate = addDaysToDateString(today, -(days - 1));

    const createdAts = await this.dashboardRepository.findUserCreatedAtsSince(getKstDayStart(firstDate), tx);

    const countByDate = new Map<string, number>();
    for (const createdAt of createdAts) {
      const date = toKstDateString(createdAt);
      countByDate.set(date, (countByDate.get(date) ?? 0) + 1);
    }

    const dailySignups: AdminDashboardSignups['days'] = [];
    for (let offset = 0; offset < days; offset += 1) {
      const date = addDaysToDateString(firstDate, offset);
      dailySignups.push({ date, count: countByDate.get(date) ?? 0 });
    }

    return { days: dailySignups };
  }

  /**
   * 기간 내 가입한 유저 코호트의 가입 → 프로필 완성 → 밴드 가입 → 첫 일정 생성 퍼널을 만든다.
   * 종료일이 없으면 오늘(KST), 시작일이 없으면 종료일 포함 최근 30일의 첫날을 쓴다.
   *
   * @param {AdminDashboardFunnelRange} range - 조회 기간(KST 날짜, to 포함)
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AdminDashboardFunnel>} 퍼널 단계별 인원
   * @throws {BadRequestException} 시작일이 종료일보다 늦거나 기간이 366일을 넘을 때
   */
  async getFunnel(range: AdminDashboardFunnelRange, tx?: Prisma.TransactionClient): Promise<AdminDashboardFunnel> {
    const to = range.to ?? toKstDateString(new Date());
    const from = range.from ?? addDaysToDateString(to, -(DEFAULT_FUNNEL_DAYS - 1));

    const daysInRange = countDaysInclusive(from, to);
    if (daysInRange < 1) {
      throw new BadRequestException('조회 시작일은 종료일보다 늦을 수 없습니다.');
    }
    if (daysInRange > MAX_FUNNEL_DAYS) {
      throw new BadRequestException(`조회 기간은 최대 ${MAX_FUNNEL_DAYS}일입니다.`);
    }

    // to 날짜를 포함하려고 끝 경계는 다음 날 KST 00:00(미만)으로 둔다
    const cohortStart = getKstDayStart(from);
    const cohortEnd = getKstDayStart(addDaysToDateString(to, 1));
    const counts = await this.dashboardRepository.countFunnel(cohortStart, cohortEnd, tx);

    const steps = ADMIN_DASHBOARD_FUNNEL_STEPS.map(step => ({ key: step.key, label: step.label, count: counts[step.key] }));
    return { from, to, steps };
  }

  /**
   * S3 버킷 전체를 훑어 스토리지 사용량을 만든다.
   * `users/{userId}/...` 키는 유저별로 합산해 상위 10명을 보여 주고,
   * 상위 10명에 들지 않은 유저 파일과 유저 폴더 밖 파일은 otherBytes로 묶는다(totalBytes = 상위 합 + otherBytes).
   *
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client(유저 정보 조회에 사용)
   * @returns {Promise<AdminDashboardStorage>} 스토리지 사용량
   */
  async getStorage(tx?: Prisma.TransactionClient): Promise<AdminDashboardStorage> {
    const scannedAt = new Date().toISOString();
    const objects = await this.listAllObjectsOrExplain();

    let totalBytes = 0;
    const usageByUserId = new Map<string, UserStorageUsage>();
    for (const object of objects) {
      totalBytes += object.size;

      const userKeyMatch = USER_OBJECT_KEY_PATTERN.exec(object.key);
      if (userKeyMatch === null) {
        continue;
      }

      const userId = userKeyMatch[1].toLowerCase();
      const usage = usageByUserId.get(userId) ?? { userId, bytes: 0, objectCount: 0 };
      usage.bytes += object.size;
      usage.objectCount += 1;
      usageByUserId.set(userId, usage);
    }

    const topUsages = [...usageByUserId.values()].sort(compareUsageByBytesDesc).slice(0, STORAGE_TOP_USER_LIMIT);
    const identities = await this.dashboardRepository.findUserIdentities(
      topUsages.map(usage => usage.userId),
      tx,
    );
    const identityByUserId = new Map(identities.map(identity => [identity.userId, identity]));

    // 버킷에 파일만 남고 DB에서 지워진 유저는 닉네임·이메일을 null로 둔다
    const topUsers = topUsages.map(usage => ({
      userId: usage.userId,
      nickname: identityByUserId.get(usage.userId)?.nickname ?? null,
      email: identityByUserId.get(usage.userId)?.email ?? null,
      bytes: usage.bytes,
      objectCount: usage.objectCount,
    }));
    const topUsersBytes = topUsers.reduce((sum, user) => sum + user.bytes, 0);

    return {
      totalBytes,
      objectCount: objects.length,
      topUsers,
      otherBytes: totalBytes - topUsersBytes,
      scannedAt,
    };
  }

  /**
   * 버킷 목록 조회 권한(s3:ListBucket)이 없으면 AWS AccessDenied가 그대로 500으로 나가 원인을 알기 어렵다.
   * 권한 문제만 골라 어드민이 조치할 수 있는 안내로 바꾼다.
   */
  private async listAllObjectsOrExplain(): Promise<{ key: string; size: number }[]> {
    try {
      return await this.storageService.listAllObjects();
    } catch (error) {
      if (error instanceof Error && error.name === 'AccessDenied') {
        throw new ServiceUnavailableException('스토리지 목록 조회 권한(s3:ListBucket)이 없어 사용량을 집계할 수 없습니다.');
      }
      throw error;
    }
  }
}

/**
 * 사용량 큰 순으로 정렬한다. 같으면 userId 순으로 두어 응답 순서를 고정한다.
 */
function compareUsageByBytesDesc(left: UserStorageUsage, right: UserStorageUsage): number {
  if (left.bytes !== right.bytes) {
    return right.bytes - left.bytes;
  }
  return left.userId.localeCompare(right.userId);
}

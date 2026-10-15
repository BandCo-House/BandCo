import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { StorageService } from 'src/storage/storage.service';

import type { AdminDashboardRepository } from './repositories/admin-dashboard.repository';
import type {
  AdminDashboardFunnelCounts,
  AdminDashboardSummaryCounts,
  AdminDashboardSummaryCriteria,
  AdminDashboardUserIdentity,
} from './types/admin-dashboard.type';
import { AdminDashboardService } from './admin-dashboard.service';

// ─── 고정 시각: KST 2026-10-05 12:00 ───────────────────────────────
const NOW = new Date('2026-10-05T03:00:00.000Z');

// ─── UUID 상수 ─────────────────────────────────────────────────────
const USER_IDS = Array.from({ length: 12 }, (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`);

const SUMMARY_COUNTS: AdminDashboardSummaryCounts = {
  users: { total: 100, active: 90, inactive: 5, suspended: 5, deleted: 3, newToday: 1, newLast7Days: 7, newLast30Days: 20 },
  activity: { dau: 10, wau: 30, mau: 60 },
  bands: { total: 12, activeLast30Days: 4 },
  bandSpaces: { total: 20 },
  schedules: { total: 300, createdLast30Days: 40 },
  reports: { pending: 2 },
};

const FUNNEL_COUNTS: AdminDashboardFunnelCounts = {
  SIGNED_UP: 50,
  PROFILE_COMPLETED: 30,
  JOINED_BAND: 20,
  CREATED_SCHEDULE: 5,
};

// ─── Repository Stub ───────────────────────────────────────────────
function createDashboardRepositoryStub(options?: {
  createdAts?: Date[];
  identities?: AdminDashboardUserIdentity[];
  onCountSummary?: (criteria: AdminDashboardSummaryCriteria, tx: unknown) => void;
  onFindUserCreatedAtsSince?: (since: Date, tx: unknown) => void;
  onCountFunnel?: (start: Date, end: Date, tx: unknown) => void;
  onFindUserIdentities?: (userIds: string[], tx: unknown) => void;
}): AdminDashboardRepository {
  return {
    async countSummary(criteria, tx) {
      options?.onCountSummary?.(criteria, tx);
      return SUMMARY_COUNTS;
    },
    async findUserCreatedAtsSince(since, tx) {
      options?.onFindUserCreatedAtsSince?.(since, tx);
      return options?.createdAts ?? [];
    },
    async countFunnel(start, end, tx) {
      options?.onCountFunnel?.(start, end, tx);
      return FUNNEL_COUNTS;
    },
    async findUserIdentities(userIds, tx) {
      options?.onFindUserIdentities?.(userIds, tx);
      return options?.identities ?? [];
    },
  };
}

// ─── StorageService Stub ───────────────────────────────────────────
function createStorageServiceStub(objects: { key: string; size: number }[] = []): StorageService {
  return {
    async listAllObjects() {
      return objects;
    },
  } as unknown as StorageService;
}

describe('AdminDashboardService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getSummary', () => {
    it('신규 가입은 KST 달력 경계, 접속·활동은 지금부터의 롤링 경계로 집계를 요청한다', async () => {
      let capturedCriteria: AdminDashboardSummaryCriteria | undefined;
      const repository = createDashboardRepositoryStub({
        onCountSummary(criteria) {
          capturedCriteria = criteria;
        },
      });
      const service = new AdminDashboardService(repository, createStorageServiceStub());

      await service.getSummary();

      expect(capturedCriteria).toEqual({
        now: NOW,
        newUsersSince: {
          today: new Date('2026-10-04T15:00:00.000Z'),
          last7Days: new Date('2026-09-28T15:00:00.000Z'),
          last30Days: new Date('2026-09-05T15:00:00.000Z'),
        },
        lastLoginSince: {
          day: new Date('2026-10-04T03:00:00.000Z'),
          week: new Date('2026-09-28T03:00:00.000Z'),
          month: new Date('2026-09-05T03:00:00.000Z'),
        },
        recentActivitySince: new Date('2026-09-05T03:00:00.000Z'),
      });
    });

    it('집계 숫자에 생성 시각을 붙여 반환한다', async () => {
      const service = new AdminDashboardService(createDashboardRepositoryStub(), createStorageServiceStub());

      const result = await service.getSummary();

      expect(result).toEqual({ ...SUMMARY_COUNTS, generatedAt: '2026-10-05T03:00:00.000Z' });
    });

    it('외부 transaction client를 repository에 그대로 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const repository = createDashboardRepositoryStub({
        onCountSummary(_criteria, tx) {
          capturedTx = tx;
        },
      });
      const service = new AdminDashboardService(repository, createStorageServiceStub());

      await service.getSummary(externalTx as never);

      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('getSignups', () => {
    it('KST 날짜로 묶어 오래된 순으로 반환하고 가입 없는 날은 0으로 채운다', async () => {
      let capturedSince: Date | undefined;
      const repository = createDashboardRepositoryStub({
        createdAts: [
          new Date('2026-10-04T15:10:00.000Z'), // KST 10-05 00:10
          new Date('2026-10-04T14:59:00.000Z'), // KST 10-04 23:59
          new Date('2026-10-02T15:00:00.000Z'), // KST 10-03 00:00
          new Date('2026-10-05T02:00:00.000Z'), // KST 10-05 11:00
        ],
        onFindUserCreatedAtsSince(since) {
          capturedSince = since;
        },
      });
      const service = new AdminDashboardService(repository, createStorageServiceStub());

      const result = await service.getSignups(4);

      expect(capturedSince).toEqual(new Date('2026-10-01T15:00:00.000Z'));
      expect(result).toEqual({
        days: [
          { date: '2026-10-02', count: 0 },
          { date: '2026-10-03', count: 1 },
          { date: '2026-10-04', count: 1 },
          { date: '2026-10-05', count: 2 },
        ],
      });
    });

    it('하루만 조회하면 오늘(KST) 한 칸만 반환한다', async () => {
      const service = new AdminDashboardService(createDashboardRepositoryStub(), createStorageServiceStub());

      const result = await service.getSignups(1);

      expect(result).toEqual({ days: [{ date: '2026-10-05', count: 0 }] });
    });

    it('외부 transaction client를 repository에 그대로 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const repository = createDashboardRepositoryStub({
        onFindUserCreatedAtsSince(_since, tx) {
          capturedTx = tx;
        },
      });
      const service = new AdminDashboardService(repository, createStorageServiceStub());

      await service.getSignups(30, externalTx as never);

      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('getFunnel', () => {
    it('기간이 없으면 오늘 포함 최근 30일 코호트로 단계별 인원을 반환한다', async () => {
      const capturedBoundaries: Date[] = [];
      const repository = createDashboardRepositoryStub({
        onCountFunnel(start, end) {
          capturedBoundaries.push(start, end);
        },
      });
      const service = new AdminDashboardService(repository, createStorageServiceStub());

      const result = await service.getFunnel({});

      expect(capturedBoundaries).toEqual([new Date('2026-09-05T15:00:00.000Z'), new Date('2026-10-05T15:00:00.000Z')]);
      expect(result).toEqual({
        from: '2026-09-06',
        to: '2026-10-05',
        steps: [
          { key: 'SIGNED_UP', label: '가입', count: 50 },
          { key: 'PROFILE_COMPLETED', label: '프로필 완성', count: 30 },
          { key: 'JOINED_BAND', label: '밴드 가입', count: 20 },
          { key: 'CREATED_SCHEDULE', label: '첫 일정 생성', count: 5 },
        ],
      });
    });

    it('종료일만 주면 종료일 포함 30일 전부터 조회한다', async () => {
      const service = new AdminDashboardService(createDashboardRepositoryStub(), createStorageServiceStub());

      const result = await service.getFunnel({ to: '2026-03-01' });

      expect(result.from).toBe('2026-01-31');
      expect(result.to).toBe('2026-03-01');
    });

    it('시작일과 종료일이 같으면 그 하루(KST)를 조회한다', async () => {
      const capturedBoundaries: Date[] = [];
      const repository = createDashboardRepositoryStub({
        onCountFunnel(start, end) {
          capturedBoundaries.push(start, end);
        },
      });
      const service = new AdminDashboardService(repository, createStorageServiceStub());

      await service.getFunnel({ from: '2026-10-01', to: '2026-10-01' });

      expect(capturedBoundaries).toEqual([new Date('2026-09-30T15:00:00.000Z'), new Date('2026-10-01T15:00:00.000Z')]);
    });

    it('양 끝 포함 366일은 허용한다', async () => {
      const service = new AdminDashboardService(createDashboardRepositoryStub(), createStorageServiceStub());

      const result = await service.getFunnel({ from: '2025-10-05', to: '2026-10-05' });

      expect(result.from).toBe('2025-10-05');
    });

    it('시작일이 종료일보다 늦으면 BadRequestException을 던진다', async () => {
      const service = new AdminDashboardService(createDashboardRepositoryStub(), createStorageServiceStub());

      await expect(service.getFunnel({ from: '2026-10-05', to: '2026-10-04' })).rejects.toThrow(BadRequestException);
    });

    it('기간이 366일을 넘으면 BadRequestException을 던진다', async () => {
      const service = new AdminDashboardService(createDashboardRepositoryStub(), createStorageServiceStub());

      await expect(service.getFunnel({ from: '2025-10-04', to: '2026-10-05' })).rejects.toThrow(BadRequestException);
    });

    it('외부 transaction client를 repository에 그대로 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const repository = createDashboardRepositoryStub({
        onCountFunnel(_start, _end, tx) {
          capturedTx = tx;
        },
      });
      const service = new AdminDashboardService(repository, createStorageServiceStub());

      await service.getFunnel({}, externalTx as never);

      expect(capturedTx).toBe(externalTx);
    });
  });

  describe('getStorage', () => {
    it('버킷 목록 권한이 없으면(AccessDenied) 조치 안내를 담은 ServiceUnavailableException을 던진다', async () => {
      const accessDenied = Object.assign(new Error('Access Denied'), { name: 'AccessDenied' });
      const storageService = {
        async listAllObjects() {
          throw accessDenied;
        },
      } as unknown as StorageService;
      const service = new AdminDashboardService(createDashboardRepositoryStub(), storageService);

      await expect(service.getStorage()).rejects.toThrow(
        new ServiceUnavailableException('스토리지 목록 조회 권한(s3:ListBucket)이 없어 사용량을 집계할 수 없습니다.'),
      );
    });

    it('권한 외 S3 오류는 그대로 전파한다', async () => {
      const networkError = new Error('socket hang up');
      const storageService = {
        async listAllObjects() {
          throw networkError;
        },
      } as unknown as StorageService;
      const service = new AdminDashboardService(createDashboardRepositoryStub(), storageService);

      await expect(service.getStorage()).rejects.toBe(networkError);
    });

    it('유저 폴더 키를 유저별로 합산해 상위 10명을 사용량 순으로 반환하고 나머지는 otherBytes로 묶는다', async () => {
      // USER_IDS[i]는 (i + 1) * 100바이트 파일 1개, 첫 유저만 파일 2개(합 250바이트로 상위 10명 밖)
      const userObjects = USER_IDS.map((userId, index) => ({ key: `users/${userId}/profiles/${index}.jpeg`, size: (index + 1) * 100 }));
      const objects = [
        ...userObjects,
        { key: `users/${USER_IDS[0]}/profiles/extra.jpeg`, size: 150 },
        { key: 'bands/cover.png', size: 1000 },
        { key: 'users/not-a-uuid/file.png', size: 7 },
      ];
      let capturedUserIds: string[] | undefined;
      const repository = createDashboardRepositoryStub({
        identities: [{ userId: USER_IDS[11], nickname: '드러머', email: 'drum@example.com' }],
        onFindUserIdentities(userIds) {
          capturedUserIds = userIds;
        },
      });
      const service = new AdminDashboardService(repository, createStorageServiceStub(objects));

      const result = await service.getStorage();

      // 유저 파일 합 7800 + 첫 유저 추가 150 + 유저 폴더 밖 1007
      expect(result.totalBytes).toBe(8957);
      expect(result.objectCount).toBe(15);
      expect(result.topUsers.map(user => user.userId)).toEqual([
        USER_IDS[11],
        USER_IDS[10],
        USER_IDS[9],
        USER_IDS[8],
        USER_IDS[7],
        USER_IDS[6],
        USER_IDS[5],
        USER_IDS[4],
        USER_IDS[3],
        USER_IDS[2],
      ]);
      expect(capturedUserIds).toEqual(result.topUsers.map(user => user.userId));
      expect(result.topUsers[0]).toEqual({ userId: USER_IDS[11], nickname: '드러머', email: 'drum@example.com', bytes: 1200, objectCount: 1 });
      expect(result.topUsers[1]).toEqual({ userId: USER_IDS[10], nickname: null, email: null, bytes: 1100, objectCount: 1 });
      // 상위 10명 합 = 300+400+...+1200 = 7500, 나머지 = 8957 - 7500
      expect(result.otherBytes).toBe(1457);
      expect(result.scannedAt).toBe('2026-10-05T03:00:00.000Z');
    });

    it('사용량이 같으면 userId 순으로 정렬하고 같은 유저의 파일 수를 합산한다', async () => {
      const objects = [
        { key: `users/${USER_IDS[1]}/a.png`, size: 100 },
        { key: `users/${USER_IDS[0]}/a.png`, size: 50 },
        { key: `users/${USER_IDS[0]}/b.png`, size: 50 },
      ];
      const service = new AdminDashboardService(createDashboardRepositoryStub(), createStorageServiceStub(objects));

      const result = await service.getStorage();

      expect(result.topUsers).toEqual([
        { userId: USER_IDS[0], nickname: null, email: null, bytes: 100, objectCount: 2 },
        { userId: USER_IDS[1], nickname: null, email: null, bytes: 100, objectCount: 1 },
      ]);
      expect(result.otherBytes).toBe(0);
    });

    it('빈 버킷이면 모든 값이 0이다', async () => {
      const service = new AdminDashboardService(createDashboardRepositoryStub(), createStorageServiceStub([]));

      const result = await service.getStorage();

      expect(result).toEqual({ totalBytes: 0, objectCount: 0, topUsers: [], otherBytes: 0, scannedAt: '2026-10-05T03:00:00.000Z' });
    });

    it('외부 transaction client를 유저 정보 조회에 그대로 전달한다', async () => {
      const externalTx = { transactionClient: true };
      let capturedTx: unknown;
      const repository = createDashboardRepositoryStub({
        onFindUserIdentities(_userIds, tx) {
          capturedTx = tx;
        },
      });
      const service = new AdminDashboardService(repository, createStorageServiceStub([{ key: `users/${USER_IDS[0]}/a.png`, size: 1 }]));

      await service.getStorage(externalTx as never);

      expect(capturedTx).toBe(externalTx);
    });
  });
});

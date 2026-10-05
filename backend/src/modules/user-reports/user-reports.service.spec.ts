import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';

import type { UserReportsRepository } from './repositories/user-reports.repository';
import type { CreateUserReportData } from './types/user-report.type';
import { UserReportsService } from './user-reports.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const REPORTER_ID = '11111111-1111-4111-8111-111111111111';
const REPORTED_ID = '22222222-2222-4222-8222-222222222222';
const REPORT_ID = '33333333-3333-4333-8333-333333333333';

// ─── Repository Stub ─────────────────────────────────────────────
function createUserReportsRepositoryStub(options?: {
  isReportedUserActive?: boolean;
  hasPendingReport?: boolean;
  onExistsActiveUser?: (userId: string, tx: unknown) => void;
  onExistsPendingReport?: (tx: unknown) => void;
  onCreate?: (data: CreateUserReportData, tx: unknown) => void;
}): UserReportsRepository {
  return {
    async existsActiveUser(userId, tx) {
      options?.onExistsActiveUser?.(userId, tx);
      return options?.isReportedUserActive ?? true;
    },
    async existsPendingReport(_reporterUserId, _reportedUserId, tx) {
      options?.onExistsPendingReport?.(tx);
      return options?.hasPendingReport ?? false;
    },
    async create(data, tx) {
      options?.onCreate?.(data, tx);
      return { reportId: REPORT_ID };
    },
  };
}

// ─── PrismaService Stub ──────────────────────────────────────────
function createPrismaServiceStub(): PrismaService {
  const tx = { transactionClient: true };
  return {
    async $transaction(callback: (client: unknown) => Promise<unknown>) {
      return callback(tx);
    },
  } as unknown as PrismaService;
}

function createPrismaServiceFailingTransactionStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}

describe('UserReportsService', () => {
  describe('createUserReport', () => {
    it('신고를 저장하고 신고 ID를 반환한다', async () => {
      let capturedData: CreateUserReportData | undefined;
      const repository = createUserReportsRepositoryStub({
        onCreate(data) {
          capturedData = data;
        },
      });
      const service = new UserReportsService(repository, createPrismaServiceStub());

      const result = await service.createUserReport(REPORTER_ID, REPORTED_ID, { reason: 'SPAM', description: '광고를 보냅니다.' });

      expect(result).toEqual({ reportId: REPORT_ID });
      expect(capturedData).toEqual({ reporterUserId: REPORTER_ID, reportedUserId: REPORTED_ID, reason: 'SPAM', description: '광고를 보냅니다.' });
    });

    it('설명이 없으면 null로 저장한다', async () => {
      let capturedData: CreateUserReportData | undefined;
      const repository = createUserReportsRepositoryStub({
        onCreate(data) {
          capturedData = data;
        },
      });
      const service = new UserReportsService(repository, createPrismaServiceStub());

      await service.createUserReport(REPORTER_ID, REPORTED_ID, { reason: 'OTHER' });

      expect(capturedData?.description).toBeNull();
    });

    it('본인을 신고하면 BadRequestException을 던진다', async () => {
      const service = new UserReportsService(createUserReportsRepositoryStub(), createPrismaServiceStub());

      await expect(service.createUserReport(REPORTER_ID, REPORTER_ID, { reason: 'SPAM' })).rejects.toThrow(BadRequestException);
    });

    it('대상이 없거나 탈퇴했으면 NotFoundException을 던진다', async () => {
      let capturedUserId: string | undefined;
      const repository = createUserReportsRepositoryStub({
        isReportedUserActive: false,
        onExistsActiveUser(userId) {
          capturedUserId = userId;
        },
      });
      const service = new UserReportsService(repository, createPrismaServiceStub());

      await expect(service.createUserReport(REPORTER_ID, REPORTED_ID, { reason: 'SPAM' })).rejects.toThrow(NotFoundException);
      expect(capturedUserId).toBe(REPORTED_ID);
    });

    it('같은 대상에게 처리 대기 신고가 있으면 ConflictException을 던지고 저장하지 않는다', async () => {
      const capturedCreates: CreateUserReportData[] = [];
      const repository = createUserReportsRepositoryStub({
        hasPendingReport: true,
        onCreate(data) {
          capturedCreates.push(data);
        },
      });
      const service = new UserReportsService(repository, createPrismaServiceStub());

      await expect(service.createUserReport(REPORTER_ID, REPORTED_ID, { reason: 'SPAM' })).rejects.toThrow(ConflictException);
      expect(capturedCreates).toHaveLength(0);
    });

    it('검증과 저장을 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createUserReportsRepositoryStub({
        onExistsActiveUser(_userId, tx) {
          capturedTransactions.push(tx);
        },
        onExistsPendingReport(tx) {
          capturedTransactions.push(tx);
        },
        onCreate(_data, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new UserReportsService(repository, createPrismaServiceStub());

      await service.createUserReport(REPORTER_ID, REPORTED_ID, { reason: 'ABUSE' });

      expect(capturedTransactions).toHaveLength(3);
      expect(new Set(capturedTransactions).size).toBe(1);
      expect(capturedTransactions[0]).toEqual({ transactionClient: true });
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { externalTransactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createUserReportsRepositoryStub({
        onCreate(_data, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new UserReportsService(repository, createPrismaServiceFailingTransactionStub());

      await service.createUserReport(REPORTER_ID, REPORTED_ID, { reason: 'ABUSE' }, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditLogsRepository } from '../core/repositories/admin-audit-logs.repository';
import type { RecordAdminAuditLogInput } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminReportsRepository } from './repositories/admin-reports.repository';
import type { AdminReport, AdminReportFilter, ResolveAdminReportData } from './types/admin-report.type';
import { AdminReportsService } from './admin-reports.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const REPORT_ID = '22222222-2222-4222-8222-222222222222';
const REPORTER_ID = '33333333-3333-4333-8333-333333333333';
const REPORTED_ID = '44444444-4444-4444-8444-444444444444';

const ADMIN: AdminPrincipal = { id: ADMIN_ID, email: 'admin@bandco.kr', name: '운영자', role: 'OPERATOR' };

const PENDING_REPORT: AdminReport = {
  reportId: REPORT_ID,
  reason: 'SPAM',
  description: '광고 메시지를 반복해서 보냅니다.',
  status: 'PENDING',
  reporter: { userId: REPORTER_ID, nickname: '신고자', email: 'reporter@bandco.kr' },
  reported: { userId: REPORTED_ID, nickname: '피신고자', email: 'reported@bandco.kr', isSuspended: false },
  createdAt: '2026-10-01T00:00:00.000Z',
  resolvedAt: null,
  resolutionNote: null,
  resolvedBy: null,
};

// ─── Repository Stub ─────────────────────────────────────────────
function createReportsRepositoryStub(options?: {
  report?: AdminReport | null;
  isResolvable?: boolean;
  totalCount?: number;
  onFindMany?: (filter: AdminReportFilter, tx: unknown) => void;
  onFindById?: (tx: unknown) => void;
  onResolvePending?: (data: ResolveAdminReportData, tx: unknown) => void;
}): AdminReportsRepository {
  let resolvedData: ResolveAdminReportData | null = null;

  return {
    async findMany(filter, _pagination, _now, tx) {
      options?.onFindMany?.(filter, tx);
      return { items: [PENDING_REPORT], totalCount: options?.totalCount ?? 1 };
    },
    async findById(_reportId, _now, tx) {
      options?.onFindById?.(tx);
      const report = options?.report !== undefined ? options.report : PENDING_REPORT;
      if (report === null || resolvedData === null) {
        return report;
      }
      // 처리 후 재조회에는 저장한 처리 결과가 반영된 신고를 돌려준다.
      return {
        ...report,
        status: resolvedData.status,
        resolutionNote: resolvedData.resolutionNote,
        resolvedAt: resolvedData.resolvedAt.toISOString(),
        resolvedBy: { adminId: resolvedData.resolvedByAdminId, name: ADMIN.name },
      };
    },
    async resolvePending(_reportId, data, tx) {
      options?.onResolvePending?.(data, tx);
      if (options?.isResolvable === false) {
        return false;
      }
      resolvedData = data;
      return true;
    },
  };
}

function createAuditLogsServiceStub(options?: { onRecord?: (input: RecordAdminAuditLogInput, tx: unknown) => void }): AdminAuditLogsService {
  const repository: AdminAuditLogsRepository = {
    async create(input, tx) {
      options?.onRecord?.(input, tx);
    },
    async findMany() {
      return { items: [], totalCount: 0 };
    },
  };
  return new AdminAuditLogsService(repository);
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

describe('AdminReportsService', () => {
  describe('getReports', () => {
    it('상태 필터를 넘겨 조회하고 페이지 정보를 붙여 반환한다', async () => {
      let capturedFilter: AdminReportFilter | undefined;
      const repository = createReportsRepositoryStub({
        totalCount: 21,
        onFindMany(filter) {
          capturedFilter = filter;
        },
      });
      const service = new AdminReportsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      const result = await service.getReports({ status: 'PENDING' }, { page: 1, size: 20 });

      expect(capturedFilter).toEqual({ status: 'PENDING' });
      expect(result).toEqual({ items: [PENDING_REPORT], pagination: { page: 1, size: 20, totalCount: 21, hasNext: true } });
    });
  });

  describe('getReport', () => {
    it('신고가 있으면 그대로 반환한다', async () => {
      const service = new AdminReportsService(createReportsRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      const result = await service.getReport(REPORT_ID);

      expect(result).toEqual(PENDING_REPORT);
    });

    it('신고가 없으면 NotFoundException을 던진다', async () => {
      const repository = createReportsRepositoryStub({ report: null });
      const service = new AdminReportsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.getReport(REPORT_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolveReport', () => {
    it('PENDING 신고를 처리하고 처리 결과가 반영된 신고를 반환한다', async () => {
      let capturedData: ResolveAdminReportData | undefined;
      const repository = createReportsRepositoryStub({
        onResolvePending(data) {
          capturedData = data;
        },
      });
      const service = new AdminReportsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      const result = await service.resolveReport(ADMIN, REPORT_ID, { status: 'RESOLVED', resolutionNote: '경고 조치' });

      expect(capturedData).toEqual({ status: 'RESOLVED', resolutionNote: '경고 조치', resolvedAt: expect.any(Date), resolvedByAdminId: ADMIN_ID });
      expect(result.status).toBe('RESOLVED');
      expect(result.resolutionNote).toBe('경고 조치');
      expect(result.resolvedBy).toEqual({ adminId: ADMIN_ID, name: ADMIN.name });
    });

    it('메모가 없으면 resolutionNote를 null로 저장한다', async () => {
      let capturedData: ResolveAdminReportData | undefined;
      const repository = createReportsRepositoryStub({
        onResolvePending(data) {
          capturedData = data;
        },
      });
      const service = new AdminReportsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await service.resolveReport(ADMIN, REPORT_ID, { status: 'DISMISSED' });

      expect(capturedData?.resolutionNote).toBeNull();
    });

    it('처리 결과를 감사 로그로 남긴다', async () => {
      const capturedAuditInputs: RecordAdminAuditLogInput[] = [];
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(input) {
          capturedAuditInputs.push(input);
        },
      });
      const service = new AdminReportsService(createReportsRepositoryStub(), auditLogsService, createPrismaServiceStub());

      await service.resolveReport(ADMIN, REPORT_ID, { status: 'DISMISSED' });

      expect(capturedAuditInputs).toEqual([
        { adminUserId: ADMIN_ID, action: 'REPORT_RESOLVE', targetType: 'REPORT', targetId: REPORT_ID, detail: { status: 'DISMISSED' } },
      ]);
    });

    it('신고가 없으면 NotFoundException을 던진다', async () => {
      const repository = createReportsRepositoryStub({ report: null });
      const service = new AdminReportsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.resolveReport(ADMIN, REPORT_ID, { status: 'RESOLVED' })).rejects.toThrow(NotFoundException);
    });

    it('이미 처리된 신고면 BadRequestException을 던지고 감사 로그를 남기지 않는다', async () => {
      const capturedAuditInputs: RecordAdminAuditLogInput[] = [];
      const repository = createReportsRepositoryStub({ report: { ...PENDING_REPORT, status: 'DISMISSED' } });
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(input) {
          capturedAuditInputs.push(input);
        },
      });
      const service = new AdminReportsService(repository, auditLogsService, createPrismaServiceStub());

      await expect(service.resolveReport(ADMIN, REPORT_ID, { status: 'RESOLVED' })).rejects.toThrow(BadRequestException);
      expect(capturedAuditInputs).toHaveLength(0);
    });

    it('조회 후 다른 어드민이 먼저 처리했으면 BadRequestException을 던진다', async () => {
      const repository = createReportsRepositoryStub({ isResolvable: false });
      const service = new AdminReportsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.resolveReport(ADMIN, REPORT_ID, { status: 'RESOLVED' })).rejects.toThrow(BadRequestException);
    });

    it('조회·갱신·감사 로그를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createReportsRepositoryStub({
        onFindById(tx) {
          capturedTransactions.push(tx);
        },
        onResolvePending(_data, tx) {
          capturedTransactions.push(tx);
        },
      });
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new AdminReportsService(repository, auditLogsService, createPrismaServiceStub());

      await service.resolveReport(ADMIN, REPORT_ID, { status: 'RESOLVED' });

      expect(capturedTransactions).toHaveLength(4);
      expect(new Set(capturedTransactions).size).toBe(1);
      expect(capturedTransactions[0]).toEqual({ transactionClient: true });
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { externalTransactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createReportsRepositoryStub({
        onResolvePending(_data, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new AdminReportsService(repository, createAuditLogsServiceStub(), createPrismaServiceFailingTransactionStub());

      await service.resolveReport(ADMIN, REPORT_ID, { status: 'RESOLVED' }, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });
});

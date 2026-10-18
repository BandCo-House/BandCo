import type { PaginationParams } from 'src/common/pagination';
import type { Prisma } from 'src/generated/prisma';

import type { AdminAuditLogsRepository } from './repositories/admin-audit-logs.repository';
import type { AdminAuditLogFilter, AdminAuditLogListItem, RecordAdminAuditLogInput } from './types/admin-audit.type';
import { AdminAuditLogsService } from './admin-audit-logs.service';

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';

const LOG_ITEM: AdminAuditLogListItem = {
  auditLogId: '33333333-3333-4333-8333-333333333333',
  admin: { adminId: ADMIN_ID, name: '관리자', email: 'admin@bandco.kr' },
  action: 'USER_WITHDRAW',
  targetType: 'USER',
  targetId: USER_ID,
  detail: null,
  createdAt: '2026-10-05T00:00:00.000Z',
};

function setup(totalCount: number) {
  const observed: {
    creates: { input: RecordAdminAuditLogInput; tx: unknown }[];
    findManyArgs: { filter: AdminAuditLogFilter; pagination: PaginationParams; tx: unknown }[];
  } = { creates: [], findManyArgs: [] };

  const repository: AdminAuditLogsRepository = {
    async create(input, tx) {
      observed.creates.push({ input, tx });
    },
    async findMany(filter, pagination, tx) {
      observed.findManyArgs.push({ filter, pagination, tx });
      return { items: [LOG_ITEM], totalCount };
    },
  };

  return { service: new AdminAuditLogsService(repository), observed };
}

describe('AdminAuditLogsService', () => {
  describe('record', () => {
    it('전달받은 tx로 감사 로그를 저장한다', async () => {
      const { service, observed } = setup(0);
      const tx = { transactionClient: true } as unknown as Prisma.TransactionClient;
      const input: RecordAdminAuditLogInput = {
        adminUserId: ADMIN_ID,
        action: 'USER_WITHDRAW',
        targetType: 'USER',
        targetId: USER_ID,
        detail: { reason: null },
      };

      await service.record(input, tx);

      expect(observed.creates).toEqual([{ input, tx }]);
    });
  });

  describe('getAuditLogs', () => {
    it('필터와 페이지 정보를 넘기고 페이지네이션 메타데이터를 붙여 반환한다', async () => {
      const { service, observed } = setup(41);
      const filter: AdminAuditLogFilter = { targetType: 'USER', targetId: USER_ID };

      const result = await service.getAuditLogs(filter, { page: 2, size: 20 });

      expect(observed.findManyArgs).toEqual([{ filter, pagination: { page: 2, size: 20 }, tx: undefined }]);
      expect(result).toEqual({ items: [LOG_ITEM], pagination: { page: 2, size: 20, totalCount: 41, hasNext: true } });
    });

    it('마지막 페이지면 hasNext가 false다', async () => {
      const { service } = setup(40);

      const result = await service.getAuditLogs({}, { page: 2, size: 20 });

      expect(result.pagination.hasNext).toBe(false);
    });

    it('외부 tx를 저장소에 그대로 전달한다', async () => {
      const { service, observed } = setup(1);
      const tx = { external: true } as unknown as Prisma.TransactionClient;

      await service.getAuditLogs({}, { page: 1, size: 20 }, tx);

      expect(observed.findManyArgs[0].tx).toBe(tx);
    });
  });
});

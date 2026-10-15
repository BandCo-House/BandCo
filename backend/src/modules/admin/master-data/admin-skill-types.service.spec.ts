import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditLogsRepository } from '../core/repositories/admin-audit-logs.repository';
import type { RecordAdminAuditLogInput } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminSkillTypesRepository } from './repositories/admin-skill-types.repository';
import type { AdminSkillTypeItem } from './types/admin-master-data.type';
import { AdminSkillTypesService } from './admin-skill-types.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
// 세션 마스터 데이터는 이름 기반 UUID v5 고정 ID를 쓰므로 v5 형식 ID로 검증한다
const SKILL_TYPE_ID = '6f1f2a3b-4c5d-5e6f-8a7b-9c0d1e2f3a4b';
const OTHER_SKILL_TYPE_ID = '22222222-2222-4222-8222-222222222222';
const CREATED_SKILL_TYPE_ID = '33333333-3333-4333-8333-333333333333';

const ADMIN: AdminPrincipal = { id: ADMIN_ID, email: 'operator@bandco.kr', name: '운영자', role: 'OPERATOR' };

const UNUSED_SKILL_TYPE: AdminSkillTypeItem = { skillTypeId: SKILL_TYPE_ID, name: '보컬', sortOrder: 0, usageCount: 0 };

// ─── Repository Stub ─────────────────────────────────────────────
function createAdminSkillTypesRepositoryStub(options?: {
  skillType?: AdminSkillTypeItem | null;
  idByName?: { id: string } | null;
  maxSortOrder?: number | null;
  saveError?: Error;
  onAnyCall?: (tx: unknown) => void;
  onCreate?: (data: { name: string; sortOrder: number }) => void;
  onUpdate?: (skillTypeId: string, data: { name?: string; sortOrder?: number }) => void;
  onDelete?: (skillTypeId: string) => void;
}): AdminSkillTypesRepository {
  const skillType = options?.skillType !== undefined ? options.skillType : UNUSED_SKILL_TYPE;

  return {
    async findSkillTypes(tx) {
      options?.onAnyCall?.(tx);
      return [UNUSED_SKILL_TYPE];
    },
    async findSkillTypeById(_skillTypeId, tx) {
      options?.onAnyCall?.(tx);
      return skillType;
    },
    async findSkillTypeIdByName(_name, tx) {
      options?.onAnyCall?.(tx);
      if (options?.idByName !== undefined) return options.idByName;
      return null;
    },
    async findMaxSkillTypeSortOrder(tx) {
      options?.onAnyCall?.(tx);
      if (options?.maxSortOrder !== undefined) return options.maxSortOrder;
      return 4;
    },
    async createSkillType(data, tx) {
      options?.onAnyCall?.(tx);
      options?.onCreate?.(data);
      if (options?.saveError) throw options.saveError;
      return { skillTypeId: CREATED_SKILL_TYPE_ID, name: data.name, sortOrder: data.sortOrder, usageCount: 0 };
    },
    async updateSkillType(skillTypeId, data, tx) {
      options?.onAnyCall?.(tx);
      options?.onUpdate?.(skillTypeId, data);
      if (options?.saveError) throw options.saveError;
      return { ...UNUSED_SKILL_TYPE, name: data.name ?? UNUSED_SKILL_TYPE.name, sortOrder: data.sortOrder ?? UNUSED_SKILL_TYPE.sortOrder };
    },
    async deleteSkillType(skillTypeId, tx) {
      options?.onAnyCall?.(tx);
      options?.onDelete?.(skillTypeId);
    },
  };
}

function createAuditLogsServiceStub(onRecord?: (input: RecordAdminAuditLogInput, tx: unknown) => void): AdminAuditLogsService {
  const repository: AdminAuditLogsRepository = {
    async create(input, tx) {
      onRecord?.(input, tx);
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

const P2002_ERROR = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: 'test' });

describe('AdminSkillTypesService', () => {
  describe('getSkillTypes', () => {
    it('세션 목록을 skillTypes 키로 감싸 반환한다', async () => {
      const service = new AdminSkillTypesService(createAdminSkillTypesRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      const result = await service.getSkillTypes();

      expect(result).toEqual({ skillTypes: [UNUSED_SKILL_TYPE] });
    });
  });

  describe('createSkillType', () => {
    it('sortOrder를 주면 그대로 저장하고 감사 로그를 남긴다', async () => {
      let capturedData: { name: string; sortOrder: number } | undefined;
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ onCreate: data => (capturedData = data) }),
        createAuditLogsServiceStub(input => capturedAudits.push(input)),
        createPrismaServiceStub(),
      );

      const result = await service.createSkillType(ADMIN, { name: '바이올린', sortOrder: 9 });

      expect(capturedData).toEqual({ name: '바이올린', sortOrder: 9 });
      expect(result).toEqual({ skillTypeId: CREATED_SKILL_TYPE_ID, name: '바이올린', sortOrder: 9, usageCount: 0 });
      expect(capturedAudits).toEqual([
        {
          adminUserId: ADMIN_ID,
          action: 'SKILL_TYPE_CREATE',
          targetType: 'SKILL_TYPE',
          targetId: CREATED_SKILL_TYPE_ID,
          detail: { name: '바이올린', sortOrder: 9 },
        },
      ]);
    });

    it('sortOrder를 생략하면 최대값 + 1로 맨 뒤에 둔다', async () => {
      let capturedData: { name: string; sortOrder: number } | undefined;
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ maxSortOrder: 4, onCreate: data => (capturedData = data) }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await service.createSkillType(ADMIN, { name: '바이올린' });

      expect(capturedData?.sortOrder).toBe(5);
    });

    it('세션이 하나도 없으면 sortOrder 0으로 만든다', async () => {
      let capturedData: { name: string; sortOrder: number } | undefined;
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ maxSortOrder: null, onCreate: data => (capturedData = data) }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await service.createSkillType(ADMIN, { name: '바이올린' });

      expect(capturedData?.sortOrder).toBe(0);
    });

    it('같은 이름이 있으면 ConflictException을 던지고 저장하지 않는다', async () => {
      let created = false;
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ idByName: { id: OTHER_SKILL_TYPE_ID }, onCreate: () => (created = true) }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.createSkillType(ADMIN, { name: '보컬' })).rejects.toThrow(ConflictException);
      expect(created).toBe(false);
    });

    it('저장 중 P2002가 발생하면 ConflictException으로 변환한다', async () => {
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ saveError: P2002_ERROR }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.createSkillType(ADMIN, { name: '바이올린' })).rejects.toThrow(ConflictException);
    });

    it('P2002 이외의 오류는 그대로 전파한다', async () => {
      const unexpectedError = new Error('connection lost');
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ saveError: unexpectedError }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.createSkillType(ADMIN, { name: '바이올린' })).rejects.toBe(unexpectedError);
    });

    it('조회·저장·감사 로그를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceStub(),
      );

      await service.createSkillType(ADMIN, { name: '바이올린' });

      expect(capturedTransactions).toHaveLength(4);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.createSkillType(ADMIN, { name: '바이올린' }, externalTx as never);

      expect(capturedTransactions).toHaveLength(4);
      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });

  describe('updateSkillType', () => {
    it('이름·순서를 바꾸고 바뀐 값으로 감사 로그를 남긴다', async () => {
      let capturedUpdate: { skillTypeId: string; data: { name?: string; sortOrder?: number } } | undefined;
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ onUpdate: (skillTypeId, data) => (capturedUpdate = { skillTypeId, data }) }),
        createAuditLogsServiceStub(input => capturedAudits.push(input)),
        createPrismaServiceStub(),
      );

      const result = await service.updateSkillType(ADMIN, SKILL_TYPE_ID, { name: '메인 보컬', sortOrder: 1 });

      expect(capturedUpdate).toEqual({ skillTypeId: SKILL_TYPE_ID, data: { name: '메인 보컬', sortOrder: 1 } });
      expect(result).toEqual({ skillTypeId: SKILL_TYPE_ID, name: '메인 보컬', sortOrder: 1, usageCount: 0 });
      expect(capturedAudits).toEqual([
        {
          adminUserId: ADMIN_ID,
          action: 'SKILL_TYPE_UPDATE',
          targetType: 'SKILL_TYPE',
          targetId: SKILL_TYPE_ID,
          detail: { name: '메인 보컬', sortOrder: 1 },
        },
      ]);
    });

    it('이름 없이 순서만 바꾸면 이름 중복 검사를 하지 않는다', async () => {
      let checkedName = false;
      const repository = createAdminSkillTypesRepositoryStub();
      const service = new AdminSkillTypesService(
        {
          ...repository,
          async findSkillTypeIdByName(name, tx) {
            checkedName = true;
            return repository.findSkillTypeIdByName(name, tx);
          },
        },
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await service.updateSkillType(ADMIN, SKILL_TYPE_ID, { sortOrder: 2 });

      expect(checkedName).toBe(false);
    });

    it('자기 자신과 같은 이름이면 중복으로 보지 않는다', async () => {
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ idByName: { id: SKILL_TYPE_ID } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      const result = await service.updateSkillType(ADMIN, SKILL_TYPE_ID, { name: '보컬' });

      expect(result.skillTypeId).toBe(SKILL_TYPE_ID);
    });

    it('세션이 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ skillType: null }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.updateSkillType(ADMIN, SKILL_TYPE_ID, { sortOrder: 1 })).rejects.toThrow(NotFoundException);
    });

    it('다른 세션과 이름이 같으면 ConflictException을 던진다', async () => {
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ idByName: { id: OTHER_SKILL_TYPE_ID } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.updateSkillType(ADMIN, SKILL_TYPE_ID, { name: '기타' })).rejects.toThrow(ConflictException);
    });

    it('저장 중 P2002가 발생하면 ConflictException으로 변환한다', async () => {
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ saveError: P2002_ERROR }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.updateSkillType(ADMIN, SKILL_TYPE_ID, { name: '바이올린' })).rejects.toThrow(ConflictException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.updateSkillType(ADMIN, SKILL_TYPE_ID, { name: '바이올린' }, externalTx as never);

      expect(capturedTransactions).toHaveLength(4);
      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });

  describe('deleteSkillType', () => {
    it('사용되지 않는 세션을 지우고 감사 로그를 같은 transaction에서 남긴다', async () => {
      let capturedDeletedId: string | undefined;
      const capturedTransactions: unknown[] = [];
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({
          onAnyCall: tx => capturedTransactions.push(tx),
          onDelete: skillTypeId => (capturedDeletedId = skillTypeId),
        }),
        createAuditLogsServiceStub((input, tx) => {
          capturedAudits.push(input);
          capturedTransactions.push(tx);
        }),
        createPrismaServiceStub(),
      );

      const result = await service.deleteSkillType(ADMIN, SKILL_TYPE_ID);

      expect(result).toEqual({ skillTypeId: SKILL_TYPE_ID });
      expect(capturedDeletedId).toBe(SKILL_TYPE_ID);
      expect(capturedAudits).toEqual([
        {
          adminUserId: ADMIN_ID,
          action: 'SKILL_TYPE_DELETE',
          targetType: 'SKILL_TYPE',
          targetId: SKILL_TYPE_ID,
          detail: { name: '보컬', sortOrder: 0 },
        },
      ]);
      expect(capturedTransactions).toHaveLength(3);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('세션이 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ skillType: null }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.deleteSkillType(ADMIN, SKILL_TYPE_ID)).rejects.toThrow(NotFoundException);
    });

    it('사용 중인 세션이면 사용 횟수를 담아 ConflictException을 던지고 지우지 않는다', async () => {
      let deleted = false;
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ skillType: { ...UNUSED_SKILL_TYPE, usageCount: 30 }, onDelete: () => (deleted = true) }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.deleteSkillType(ADMIN, SKILL_TYPE_ID)).rejects.toThrow(
        new ConflictException('유저·곡·팀·일정 30건에서 사용 중인 세션은 삭제할 수 없습니다.'),
      );
      expect(deleted).toBe(false);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminSkillTypesService(
        createAdminSkillTypesRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.deleteSkillType(ADMIN, SKILL_TYPE_ID, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });
});

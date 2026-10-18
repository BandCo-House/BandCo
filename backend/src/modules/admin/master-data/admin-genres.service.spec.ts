import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import { Prisma } from 'src/generated/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditLogsRepository } from '../core/repositories/admin-audit-logs.repository';
import type { RecordAdminAuditLogInput } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminGenresRepository } from './repositories/admin-genres.repository';
import type { AdminGenreItem } from './types/admin-master-data.type';
import { AdminGenresService } from './admin-genres.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const ADMIN_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
// seed 마이그레이션의 '록 (Rock)' — 이름 기반 UUID v5 고정 ID
const GENRE_ID = '370ce3f7-0e72-5ab0-a3c4-72e4887ac75a';
const OTHER_GENRE_ID = '22222222-2222-4222-8222-222222222222';
const CREATED_GENRE_ID = '33333333-3333-4333-8333-333333333333';

const ADMIN: AdminPrincipal = { id: ADMIN_ID, email: 'operator@bandco.kr', name: '운영자', role: 'OPERATOR' };

const UNUSED_GENRE: AdminGenreItem = { genreId: GENRE_ID, name: '록 (Rock)', sortOrder: 0, usageCount: 0 };

// ─── Repository Stub ─────────────────────────────────────────────
function createAdminGenresRepositoryStub(options?: {
  genre?: AdminGenreItem | null;
  idByName?: { id: string } | null;
  maxSortOrder?: number | null;
  saveError?: Error;
  onAnyCall?: (tx: unknown) => void;
  onCreate?: (data: { name: string; sortOrder: number }) => void;
  onUpdate?: (genreId: string, data: { name?: string; sortOrder?: number }) => void;
  onDelete?: (genreId: string) => void;
}): AdminGenresRepository {
  const genre = options?.genre !== undefined ? options.genre : UNUSED_GENRE;

  return {
    async findGenres(tx) {
      options?.onAnyCall?.(tx);
      return [UNUSED_GENRE];
    },
    async findGenreById(_genreId, tx) {
      options?.onAnyCall?.(tx);
      return genre;
    },
    async findGenreIdByName(_name, tx) {
      options?.onAnyCall?.(tx);
      if (options?.idByName !== undefined) return options.idByName;
      return null;
    },
    async findMaxGenreSortOrder(tx) {
      options?.onAnyCall?.(tx);
      if (options?.maxSortOrder !== undefined) return options.maxSortOrder;
      return 7;
    },
    async createGenre(data, tx) {
      options?.onAnyCall?.(tx);
      options?.onCreate?.(data);
      if (options?.saveError) throw options.saveError;
      return { genreId: CREATED_GENRE_ID, name: data.name, sortOrder: data.sortOrder, usageCount: 0 };
    },
    async updateGenre(genreId, data, tx) {
      options?.onAnyCall?.(tx);
      options?.onUpdate?.(genreId, data);
      if (options?.saveError) throw options.saveError;
      return { ...UNUSED_GENRE, name: data.name ?? UNUSED_GENRE.name, sortOrder: data.sortOrder ?? UNUSED_GENRE.sortOrder };
    },
    async deleteGenre(genreId, tx) {
      options?.onAnyCall?.(tx);
      options?.onDelete?.(genreId);
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

describe('AdminGenresService', () => {
  describe('getGenres', () => {
    it('장르 목록을 genres 키로 감싸 반환한다', async () => {
      const service = new AdminGenresService(createAdminGenresRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      const result = await service.getGenres();

      expect(result).toEqual({ genres: [UNUSED_GENRE] });
    });
  });

  describe('createGenre', () => {
    it('sortOrder를 주면 그대로 저장하고 감사 로그를 남긴다', async () => {
      let capturedData: { name: string; sortOrder: number } | undefined;
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ onCreate: data => (capturedData = data) }),
        createAuditLogsServiceStub(input => capturedAudits.push(input)),
        createPrismaServiceStub(),
      );

      const result = await service.createGenre(ADMIN, { name: '시티팝', sortOrder: 3 });

      expect(capturedData).toEqual({ name: '시티팝', sortOrder: 3 });
      expect(result).toEqual({ genreId: CREATED_GENRE_ID, name: '시티팝', sortOrder: 3, usageCount: 0 });
      expect(capturedAudits).toEqual([
        { adminUserId: ADMIN_ID, action: 'GENRE_CREATE', targetType: 'GENRE', targetId: CREATED_GENRE_ID, detail: { name: '시티팝', sortOrder: 3 } },
      ]);
    });

    it('sortOrder를 생략하면 최대값 + 1로 맨 뒤에 둔다', async () => {
      let capturedData: { name: string; sortOrder: number } | undefined;
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ maxSortOrder: 7, onCreate: data => (capturedData = data) }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await service.createGenre(ADMIN, { name: '시티팝' });

      expect(capturedData?.sortOrder).toBe(8);
    });

    it('장르가 하나도 없으면 sortOrder 0으로 만든다', async () => {
      let capturedData: { name: string; sortOrder: number } | undefined;
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ maxSortOrder: null, onCreate: data => (capturedData = data) }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await service.createGenre(ADMIN, { name: '시티팝' });

      expect(capturedData?.sortOrder).toBe(0);
    });

    it('같은 이름이 있으면 ConflictException을 던지고 저장하지 않는다', async () => {
      let created = false;
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ idByName: { id: OTHER_GENRE_ID }, onCreate: () => (created = true) }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.createGenre(ADMIN, { name: '록 (Rock)' })).rejects.toThrow(ConflictException);
      expect(created).toBe(false);
    });

    it('저장 중 P2002가 발생하면 ConflictException으로 변환한다', async () => {
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ saveError: P2002_ERROR }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.createGenre(ADMIN, { name: '시티팝' })).rejects.toThrow(ConflictException);
    });

    it('P2002 이외의 오류는 그대로 전파한다', async () => {
      const unexpectedError = new Error('connection lost');
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ saveError: unexpectedError }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.createGenre(ADMIN, { name: '시티팝' })).rejects.toBe(unexpectedError);
    });

    it('조회·저장·감사 로그를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceStub(),
      );

      await service.createGenre(ADMIN, { name: '시티팝' });

      expect(capturedTransactions).toHaveLength(4);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.createGenre(ADMIN, { name: '시티팝' }, externalTx as never);

      expect(capturedTransactions.length).toBeGreaterThan(1);
      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });

  describe('updateGenre', () => {
    it('이름·순서를 바꾸고 바뀐 값으로 감사 로그를 남긴다', async () => {
      let capturedUpdate: { genreId: string; data: { name?: string; sortOrder?: number } } | undefined;
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ onUpdate: (genreId, data) => (capturedUpdate = { genreId, data }) }),
        createAuditLogsServiceStub(input => capturedAudits.push(input)),
        createPrismaServiceStub(),
      );

      const result = await service.updateGenre(ADMIN, GENRE_ID, { name: '록', sortOrder: 5 });

      expect(capturedUpdate).toEqual({ genreId: GENRE_ID, data: { name: '록', sortOrder: 5 } });
      expect(result).toEqual({ genreId: GENRE_ID, name: '록', sortOrder: 5, usageCount: 0 });
      expect(capturedAudits).toEqual([
        { adminUserId: ADMIN_ID, action: 'GENRE_UPDATE', targetType: 'GENRE', targetId: GENRE_ID, detail: { name: '록', sortOrder: 5 } },
      ]);
    });

    it('자기 자신과 같은 이름이면 중복으로 보지 않는다', async () => {
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ idByName: { id: GENRE_ID } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      const result = await service.updateGenre(ADMIN, GENRE_ID, { name: '록 (Rock)' });

      expect(result.genreId).toBe(GENRE_ID);
    });

    it('장르가 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ genre: null }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.updateGenre(ADMIN, GENRE_ID, { sortOrder: 1 })).rejects.toThrow(NotFoundException);
    });

    it('다른 장르와 이름이 같으면 ConflictException을 던진다', async () => {
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ idByName: { id: OTHER_GENRE_ID } }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.updateGenre(ADMIN, GENRE_ID, { name: '팝 (Pop)' })).rejects.toThrow(ConflictException);
    });

    it('저장 중 P2002가 발생하면 ConflictException으로 변환한다', async () => {
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ saveError: P2002_ERROR }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.updateGenre(ADMIN, GENRE_ID, { name: '시티팝' })).rejects.toThrow(ConflictException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.updateGenre(ADMIN, GENRE_ID, { name: '시티팝' }, externalTx as never);

      expect(capturedTransactions).toHaveLength(4);
      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });

  describe('deleteGenre', () => {
    it('사용되지 않는 장르를 지우고 감사 로그를 같은 transaction에서 남긴다', async () => {
      let capturedDeletedId: string | undefined;
      const capturedTransactions: unknown[] = [];
      const capturedAudits: RecordAdminAuditLogInput[] = [];
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx), onDelete: genreId => (capturedDeletedId = genreId) }),
        createAuditLogsServiceStub((input, tx) => {
          capturedAudits.push(input);
          capturedTransactions.push(tx);
        }),
        createPrismaServiceStub(),
      );

      const result = await service.deleteGenre(ADMIN, GENRE_ID);

      expect(result).toEqual({ genreId: GENRE_ID });
      expect(capturedDeletedId).toBe(GENRE_ID);
      expect(capturedAudits).toEqual([
        { adminUserId: ADMIN_ID, action: 'GENRE_DELETE', targetType: 'GENRE', targetId: GENRE_ID, detail: { name: '록 (Rock)', sortOrder: 0 } },
      ]);
      expect(capturedTransactions).toHaveLength(3);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('장르가 없으면 NotFoundException을 던진다', async () => {
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ genre: null }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.deleteGenre(ADMIN, GENRE_ID)).rejects.toThrow(NotFoundException);
    });

    it('사용 중인 장르면 사용 횟수를 담아 ConflictException을 던지고 지우지 않는다', async () => {
      let deleted = false;
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ genre: { ...UNUSED_GENRE, usageCount: 12 }, onDelete: () => (deleted = true) }),
        createAuditLogsServiceStub(),
        createPrismaServiceStub(),
      );

      await expect(service.deleteGenre(ADMIN, GENRE_ID)).rejects.toThrow(
        new ConflictException('밴드·유저 12건에서 사용 중인 장르는 삭제할 수 없습니다.'),
      );
      expect(deleted).toBe(false);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: 'external' };
      const capturedTransactions: unknown[] = [];
      const service = new AdminGenresService(
        createAdminGenresRepositoryStub({ onAnyCall: tx => capturedTransactions.push(tx) }),
        createAuditLogsServiceStub((_input, tx) => capturedTransactions.push(tx)),
        createPrismaServiceFailingTransactionStub(),
      );

      await service.deleteGenre(ADMIN, GENRE_ID, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      expect(capturedTransactions.every(tx => tx === externalTx)).toBe(true);
    });
  });
});

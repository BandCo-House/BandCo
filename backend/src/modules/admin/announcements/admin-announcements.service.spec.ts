import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';

import { AdminAuditLogsService } from '../core/admin-audit-logs.service';
import type { AdminAuditLogsRepository } from '../core/repositories/admin-audit-logs.repository';
import type { RecordAdminAuditLogInput } from '../core/types/admin-audit.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import type { AdminAnnouncementsRepository } from './repositories/admin-announcements.repository';
import type { AdminAnnouncement, CreateAnnouncementData, UpdateAnnouncementData } from './types/admin-announcement.type';
import { AdminAnnouncementsService } from './admin-announcements.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const ANNOUNCEMENT_ID = '22222222-2222-4222-8222-222222222222';

const ADMIN: AdminPrincipal = { id: ADMIN_ID, email: 'admin@bandco.kr', name: '운영자', role: 'OPERATOR' };

const EXISTING_ANNOUNCEMENT: AdminAnnouncement = {
  announcementId: ANNOUNCEMENT_ID,
  title: '정기 점검 안내',
  content: '10월 10일 새벽 점검이 있습니다.',
  isPublished: true,
  startsAt: '2026-10-05T00:00:00.000Z',
  endsAt: '2026-10-11T00:00:00.000Z',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  createdBy: { adminId: ADMIN_ID, name: '운영자' },
};

// ─── Repository Stub ─────────────────────────────────────────────
function createAnnouncementsRepositoryStub(options?: {
  existing?: AdminAnnouncement | null;
  onFindById?: (tx: unknown) => void;
  onCreate?: (data: CreateAnnouncementData, tx: unknown) => void;
  onUpdate?: (data: UpdateAnnouncementData, tx: unknown) => void;
  onDelete?: (announcementId: string, tx: unknown) => void;
}): AdminAnnouncementsRepository {
  return {
    async findMany() {
      return { items: [EXISTING_ANNOUNCEMENT], totalCount: 1 };
    },
    async findById(_announcementId, tx) {
      options?.onFindById?.(tx);
      if (options?.existing !== undefined) {
        return options.existing;
      }
      return EXISTING_ANNOUNCEMENT;
    },
    async create(data, tx) {
      options?.onCreate?.(data, tx);
      return {
        ...EXISTING_ANNOUNCEMENT,
        title: data.title,
        content: data.content,
        isPublished: data.isPublished,
        startsAt: data.startsAt?.toISOString() ?? null,
        endsAt: data.endsAt?.toISOString() ?? null,
      };
    },
    async update(_announcementId, data, tx) {
      options?.onUpdate?.(data, tx);
      return { ...EXISTING_ANNOUNCEMENT, title: data.title ?? EXISTING_ANNOUNCEMENT.title };
    },
    async delete(announcementId, tx) {
      options?.onDelete?.(announcementId, tx);
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

describe('AdminAnnouncementsService', () => {
  describe('getAnnouncements', () => {
    it('공지 목록에 페이지 정보를 붙여 반환한다', async () => {
      const service = new AdminAnnouncementsService(createAnnouncementsRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      const result = await service.getAnnouncements({ page: 1, size: 20 });

      expect(result).toEqual({ items: [EXISTING_ANNOUNCEMENT], pagination: { page: 1, size: 20, totalCount: 1, hasNext: false } });
    });
  });

  describe('createAnnouncement', () => {
    it('게시 기간을 Date로 바꿔 저장하고 작성 어드민을 기록한다', async () => {
      let capturedData: CreateAnnouncementData | undefined;
      const repository = createAnnouncementsRepositoryStub({
        onCreate(data) {
          capturedData = data;
        },
      });
      const service = new AdminAnnouncementsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await service.createAnnouncement(ADMIN, {
        title: '새 공지',
        content: '본문',
        isPublished: true,
        startsAt: '2026-10-05T00:00:00.000Z',
        endsAt: '2026-10-06T00:00:00.000Z',
      });

      expect(capturedData).toEqual({
        title: '새 공지',
        content: '본문',
        isPublished: true,
        startsAt: new Date('2026-10-05T00:00:00.000Z'),
        endsAt: new Date('2026-10-06T00:00:00.000Z'),
        createdByAdminId: ADMIN_ID,
      });
    });

    it('게시 기간이 없으면 null로 저장한다', async () => {
      let capturedData: CreateAnnouncementData | undefined;
      const repository = createAnnouncementsRepositoryStub({
        onCreate(data) {
          capturedData = data;
        },
      });
      const service = new AdminAnnouncementsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await service.createAnnouncement(ADMIN, { title: '새 공지', content: '본문', isPublished: false, endsAt: null });

      expect(capturedData?.startsAt).toBeNull();
      expect(capturedData?.endsAt).toBeNull();
    });

    it('생성을 감사 로그로 남긴다', async () => {
      const capturedAuditInputs: RecordAdminAuditLogInput[] = [];
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(input) {
          capturedAuditInputs.push(input);
        },
      });
      const service = new AdminAnnouncementsService(createAnnouncementsRepositoryStub(), auditLogsService, createPrismaServiceStub());

      await service.createAnnouncement(ADMIN, { title: '새 공지', content: '본문', isPublished: true });

      expect(capturedAuditInputs).toEqual([
        {
          adminUserId: ADMIN_ID,
          action: 'ANNOUNCEMENT_CREATE',
          targetType: 'ANNOUNCEMENT',
          targetId: ANNOUNCEMENT_ID,
          detail: { title: '새 공지', isPublished: true },
        },
      ]);
    });

    it('시작 시각이 종료 시각과 같으면 BadRequestException을 던진다', async () => {
      const service = new AdminAnnouncementsService(createAnnouncementsRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(
        service.createAnnouncement(ADMIN, {
          title: '새 공지',
          content: '본문',
          isPublished: true,
          startsAt: '2026-10-05T00:00:00.000Z',
          endsAt: '2026-10-05T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('시작 시각이 종료 시각보다 늦으면 BadRequestException을 던진다', async () => {
      const service = new AdminAnnouncementsService(createAnnouncementsRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(
        service.createAnnouncement(ADMIN, {
          title: '새 공지',
          content: '본문',
          isPublished: true,
          startsAt: '2026-10-06T00:00:00.000Z',
          endsAt: '2026-10-05T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('생성과 감사 로그를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createAnnouncementsRepositoryStub({
        onCreate(_data, tx) {
          capturedTransactions.push(tx);
        },
      });
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new AdminAnnouncementsService(repository, auditLogsService, createPrismaServiceStub());

      await service.createAnnouncement(ADMIN, { title: '새 공지', content: '본문', isPublished: true });

      expect(capturedTransactions).toHaveLength(2);
      expect(capturedTransactions[0]).toBe(capturedTransactions[1]);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { externalTransactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createAnnouncementsRepositoryStub({
        onCreate(_data, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new AdminAnnouncementsService(repository, createAuditLogsServiceStub(), createPrismaServiceFailingTransactionStub());

      await service.createAnnouncement(ADMIN, { title: '새 공지', content: '본문', isPublished: true }, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });

  describe('updateAnnouncement', () => {
    it('들어온 필드만 바꾸고 바뀐 필드 이름을 감사 로그로 남긴다', async () => {
      let capturedData: UpdateAnnouncementData | undefined;
      const capturedAuditInputs: RecordAdminAuditLogInput[] = [];
      const repository = createAnnouncementsRepositoryStub({
        onUpdate(data) {
          capturedData = data;
        },
      });
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(input) {
          capturedAuditInputs.push(input);
        },
      });
      const service = new AdminAnnouncementsService(repository, auditLogsService, createPrismaServiceStub());

      const result = await service.updateAnnouncement(ADMIN, ANNOUNCEMENT_ID, { title: '바뀐 제목', isPublished: false });

      expect(capturedData).toEqual({ title: '바뀐 제목', content: undefined, isPublished: false, startsAt: undefined, endsAt: undefined });
      expect(result.title).toBe('바뀐 제목');
      expect(capturedAuditInputs).toEqual([
        {
          adminUserId: ADMIN_ID,
          action: 'ANNOUNCEMENT_UPDATE',
          targetType: 'ANNOUNCEMENT',
          targetId: ANNOUNCEMENT_ID,
          detail: { changedFields: ['title', 'isPublished'] },
        },
      ]);
    });

    it('게시 기간을 null로 보내면 제한을 해제한다', async () => {
      let capturedData: UpdateAnnouncementData | undefined;
      const repository = createAnnouncementsRepositoryStub({
        onUpdate(data) {
          capturedData = data;
        },
      });
      const service = new AdminAnnouncementsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await service.updateAnnouncement(ADMIN, ANNOUNCEMENT_ID, { endsAt: null });

      expect(capturedData?.endsAt).toBeNull();
      expect(capturedData?.startsAt).toBeUndefined();
    });

    it('새 종료 시각이 기존 시작 시각보다 이르면 BadRequestException을 던진다', async () => {
      const service = new AdminAnnouncementsService(createAnnouncementsRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      // 기존 startsAt은 2026-10-05T00:00:00.000Z
      await expect(service.updateAnnouncement(ADMIN, ANNOUNCEMENT_ID, { endsAt: '2026-10-04T00:00:00.000Z' })).rejects.toThrow(BadRequestException);
    });

    it('새 시작 시각이 기존 종료 시각 이후면 BadRequestException을 던진다', async () => {
      const service = new AdminAnnouncementsService(createAnnouncementsRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      // 기존 endsAt은 2026-10-11T00:00:00.000Z
      await expect(service.updateAnnouncement(ADMIN, ANNOUNCEMENT_ID, { startsAt: '2026-10-12T00:00:00.000Z' })).rejects.toThrow(BadRequestException);
    });

    it('종료 시각을 해제하면 기존 시작 시각과 관계없이 통과한다', async () => {
      const service = new AdminAnnouncementsService(createAnnouncementsRepositoryStub(), createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.updateAnnouncement(ADMIN, ANNOUNCEMENT_ID, { startsAt: '2026-10-12T00:00:00.000Z', endsAt: null })).resolves.toBeDefined();
    });

    it('공지가 없으면 NotFoundException을 던진다', async () => {
      const repository = createAnnouncementsRepositoryStub({ existing: null });
      const service = new AdminAnnouncementsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.updateAnnouncement(ADMIN, ANNOUNCEMENT_ID, { title: '바뀐 제목' })).rejects.toThrow(NotFoundException);
    });

    it('조회·수정·감사 로그를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createAnnouncementsRepositoryStub({
        onFindById(tx) {
          capturedTransactions.push(tx);
        },
        onUpdate(_data, tx) {
          capturedTransactions.push(tx);
        },
      });
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new AdminAnnouncementsService(repository, auditLogsService, createPrismaServiceStub());

      await service.updateAnnouncement(ADMIN, ANNOUNCEMENT_ID, { title: '바뀐 제목' });

      expect(capturedTransactions).toHaveLength(3);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { externalTransactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createAnnouncementsRepositoryStub({
        onUpdate(_data, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new AdminAnnouncementsService(repository, createAuditLogsServiceStub(), createPrismaServiceFailingTransactionStub());

      await service.updateAnnouncement(ADMIN, ANNOUNCEMENT_ID, { title: '바뀐 제목' }, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });

  describe('deleteAnnouncement', () => {
    it('공지를 삭제하고 제목을 감사 로그로 남긴다', async () => {
      const capturedDeletedIds: string[] = [];
      const capturedAuditInputs: RecordAdminAuditLogInput[] = [];
      const repository = createAnnouncementsRepositoryStub({
        onDelete(announcementId) {
          capturedDeletedIds.push(announcementId);
        },
      });
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(input) {
          capturedAuditInputs.push(input);
        },
      });
      const service = new AdminAnnouncementsService(repository, auditLogsService, createPrismaServiceStub());

      const result = await service.deleteAnnouncement(ADMIN, ANNOUNCEMENT_ID);

      expect(result).toEqual({ announcementId: ANNOUNCEMENT_ID });
      expect(capturedDeletedIds).toEqual([ANNOUNCEMENT_ID]);
      expect(capturedAuditInputs).toEqual([
        {
          adminUserId: ADMIN_ID,
          action: 'ANNOUNCEMENT_DELETE',
          targetType: 'ANNOUNCEMENT',
          targetId: ANNOUNCEMENT_ID,
          detail: { title: EXISTING_ANNOUNCEMENT.title },
        },
      ]);
    });

    it('공지가 없으면 NotFoundException을 던지고 삭제하지 않는다', async () => {
      const capturedDeletedIds: string[] = [];
      const repository = createAnnouncementsRepositoryStub({
        existing: null,
        onDelete(announcementId) {
          capturedDeletedIds.push(announcementId);
        },
      });
      const service = new AdminAnnouncementsService(repository, createAuditLogsServiceStub(), createPrismaServiceStub());

      await expect(service.deleteAnnouncement(ADMIN, ANNOUNCEMENT_ID)).rejects.toThrow(NotFoundException);
      expect(capturedDeletedIds).toHaveLength(0);
    });

    it('조회·삭제·감사 로그를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createAnnouncementsRepositoryStub({
        onFindById(tx) {
          capturedTransactions.push(tx);
        },
        onDelete(_announcementId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const auditLogsService = createAuditLogsServiceStub({
        onRecord(_input, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new AdminAnnouncementsService(repository, auditLogsService, createPrismaServiceStub());

      await service.deleteAnnouncement(ADMIN, ANNOUNCEMENT_ID);

      expect(capturedTransactions).toHaveLength(3);
      expect(new Set(capturedTransactions).size).toBe(1);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { externalTransactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createAnnouncementsRepositoryStub({
        onDelete(_announcementId, tx) {
          capturedTransactions.push(tx);
        },
      });
      const service = new AdminAnnouncementsService(repository, createAuditLogsServiceStub(), createPrismaServiceFailingTransactionStub());

      await service.deleteAnnouncement(ADMIN, ANNOUNCEMENT_ID, externalTx as never);

      expect(capturedTransactions).toEqual([externalTx]);
    });
  });
});

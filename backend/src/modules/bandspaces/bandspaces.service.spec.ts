import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';

import { NotificationType } from '../../generated/prisma';
import type { NotificationsService } from '../notifications/notifications.service';

import type { BandSpacesRepository } from './repositories/bandspaces.repository';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import type { GetBandSpaceDetailResult } from './types/bandspace-detail.type';
import { BandSpacesService } from './bandspaces.service';

// ─── UUID 상수 ───────────────────────────────────────────────────
const USER_ID = '11111111-4111-4111-8111-111111111111';
const BAND_ID = '33333333-4333-4333-8333-333333333333';
const SPACE_ID = '44444444-4444-4444-8444-444444444444';
const REQUESTER_MEMBER_ID = '55555555-4555-4555-8555-555555555555';
const TARGET_BAND_MEMBER_ID = '66666666-4666-4666-8666-666666666666';
const SPACE_MEMBER_ID = '77777777-4777-4777-8777-777777777777';
const ADDED_USER_ID = '88888888-4888-4888-8888-888888888888';

const bandSpacesResult: GetBandSpacesResult = {
  items: [
    {
      spaceId: SPACE_ID,
      bandId: BAND_ID,
      createdByBandMemberId: REQUESTER_MEMBER_ID,
      name: '2026 하계공연 준비',
      description: '여름 축제 공연 준비 팀',
      spaceType: 'PERFORMANCE',
      status: 'ACTIVE',
      startDate: '2026-08-01',
      endDate: '2026-08-20',
      memberCount: 2,
      songCount: 3,
      isMine: true,
      myMembership: { isMember: true, role: 'LEADER' },
      createdAt: '2026-02-18T10:20:30.000Z',
      updatedAt: '2026-02-20T12:00:00.000Z',
    },
  ],
  pagination: { page: 1, size: 1, totalCount: 1, hasNext: false },
};

const bandSpaceDetailResult: GetBandSpaceDetailResult = {
  space: {
    spaceId: SPACE_ID,
    bandId: BAND_ID,
    name: '2026 하계공연 준비',
    description: '여름 축제 공연 준비 팀',
    spaceType: 'PERFORMANCE',
    status: 'ACTIVE',
    startDate: '2026-08-01',
    endDate: '2026-08-20',
    createdAt: '2026-02-18T10:20:30.000Z',
    updatedAt: '2026-02-20T12:00:00.000Z',
  },
  members: [
    { bandMemberId: REQUESTER_MEMBER_ID, nickname: '김민준', role: 'LEADER', status: 'ACTIVE', joinedAt: '2026-02-18T10:21:00.000Z' },
    { bandMemberId: TARGET_BAND_MEMBER_ID, nickname: '이서연', role: 'MEMBER', status: 'ACTIVE', joinedAt: '2026-02-18T10:22:00.000Z' },
  ],
  songCount: 3,
  scheduleCount: 2,
};

const createInput = {
  name: '3월 정기 합주',
  description: '정기 합주 준비',
  spaceType: 'PERFORMANCE' as const,
  status: 'ACTIVE' as const,
  startDate: '2026-03-01',
  endDate: '2026-03-20',
};

const listQuery = { query: undefined, onlyMine: undefined, inProgressOnly: undefined, page: 1, size: 20, sort: undefined };

// ─── Repository Stub ─────────────────────────────────────────────
interface RepositoryStubOptions {
  /** null이면 밴드 없음 */
  band?: { id: string } | null;
  /** null이면 요청자가 밴드 멤버 아님 */
  bandMember?: { id: string } | null;
  /** null이면 공간 없음 */
  spaceBandId?: string | null;
  /** 모든 repository 호출의 (메서드명, tx)를 관찰한다 */
  onCall?: (method: string, tx: unknown) => void;
  /** createBandSpace에 전달된 requesterBandMemberId를 관찰한다 */
  onCreate?: (requesterBandMemberId: string) => void;
  /** findBandSpaces에 전달된 requesterBandMemberId를 관찰한다 */
  onFindSpaces?: (requesterBandMemberId: string) => void;
}

function createRepositoryStub(options?: RepositoryStubOptions): BandSpacesRepository {
  const record = (method: string, tx: unknown) => options?.onCall?.(method, tx);

  return {
    async findBandById(_bandId, tx) {
      record('findBandById', tx);
      return options?.band !== undefined ? options.band : { id: BAND_ID };
    },
    async findBandMemberByBandIdAndUserId(_bandId, _userId, tx) {
      record('findBandMemberByBandIdAndUserId', tx);
      return options?.bandMember !== undefined ? options.bandMember : { id: REQUESTER_MEMBER_ID };
    },
    async findBandIdBySpaceId(_spaceId, tx) {
      record('findBandIdBySpaceId', tx);
      return options?.spaceBandId !== undefined ? options.spaceBandId : BAND_ID;
    },
    async createBandSpace(bandId, requesterBandMemberId, input, tx) {
      record('createBandSpace', tx);
      options?.onCreate?.(requesterBandMemberId);
      return {
        spaceId: SPACE_ID,
        bandId,
        name: input.name,
        description: input.description ?? '',
        spaceType: input.spaceType,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        createdByBandMemberId: requesterBandMemberId,
        createdAt: '2026-02-21T09:30:00.000Z',
      };
    },
    async findBandSpaces(_bandId, requesterBandMemberId, _query, tx) {
      record('findBandSpaces', tx);
      options?.onFindSpaces?.(requesterBandMemberId);
      return bandSpacesResult;
    },
    async findDetailByBandSpaceId(spaceId, tx) {
      record('findDetailByBandSpaceId', tx);
      return spaceId === SPACE_ID ? bandSpaceDetailResult : undefined;
    },
    async findBandMemberUserIds(_bandId, tx) {
      record('findBandMemberUserIds', tx);
      return ['user-001', 'user-002'];
    },
    async updateBandSpace(spaceId, input, tx) {
      record('updateBandSpace', tx);
      return {
        spaceId,
        bandId: BAND_ID,
        name: input.name ?? '기존 공간명',
        description: input.description ?? '',
        spaceType: input.spaceType ?? 'ONLINE',
        status: input.status ?? 'ACTIVE',
        startDate: input.startDate ?? '2026-08-01',
        endDate: input.endDate ?? '2026-08-20',
        updatedAt: '2026-05-29T10:00:00.000Z',
      };
    },
    async deleteBandSpace(spaceId, tx) {
      record('deleteBandSpace', tx);
      return { spaceId, deletedAt: '2026-05-29T10:00:00.000Z' };
    },
    async addBandSpaceMember(spaceId, input, tx) {
      record('addBandSpaceMember', tx);
      return {
        memberId: SPACE_MEMBER_ID,
        spaceId,
        userId: ADDED_USER_ID,
        bandMemberId: input.bandMemberId,
        role: input.role,
        status: 'ACTIVE',
        joinedAt: '2026-02-21T09:00:00.000Z',
        spaceName: '테스트 합주 공간',
      };
    },
    async updateBandSpaceMemberRole(spaceId, memberId, input, tx) {
      record('updateBandSpaceMemberRole', tx);
      return {
        memberId,
        spaceId,
        userId: ADDED_USER_ID,
        bandMemberId: TARGET_BAND_MEMBER_ID,
        role: input.role,
        spaceName: '테스트 합주 공간',
        updatedAt: '2026-05-29T10:00:00.000Z',
      };
    },
    async removeBandSpaceMember(spaceId, memberId, tx) {
      record('removeBandSpaceMember', tx);
      return {
        memberId,
        spaceId,
        recipientUserId: ADDED_USER_ID,
        spaceName: '테스트 합주 공간',
        removedAt: '2026-05-29T10:00:00.000Z',
      };
    },
  };
}

// ─── NotificationsService Stub ───────────────────────────────────
interface NotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  targetPath?: string;
}

function createNotificationsServiceStub() {
  const capturedNotifications: NotificationInput[] = [];
  const capturedBatches: NotificationInput[][] = [];
  const stub = {
    async createNotification(input: NotificationInput) {
      capturedNotifications.push(input);
    },
    async createManyNotifications(inputs: NotificationInput[]) {
      capturedBatches.push(inputs);
    },
  } as unknown as NotificationsService;

  return { stub, capturedNotifications, capturedBatches };
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

function createService(repository: BandSpacesRepository, prisma: PrismaService = createPrismaServiceStub()) {
  const notifications = createNotificationsServiceStub();
  const service = new BandSpacesService(repository, prisma, notifications.stub);
  return { service, ...notifications };
}

const externalTx = { transactionClient: 'external' };

/** capturedTransactions가 모두 같은 client인지 확인한다. */
function expectSameTransaction(capturedTransactions: unknown[], expectedLength: number) {
  expect(capturedTransactions).toHaveLength(expectedLength);
  capturedTransactions.forEach(tx => expect(tx).toBe(capturedTransactions[0]));
}

// ─── 테스트 ──────────────────────────────────────────────────────
describe('BandSpacesService', () => {
  describe('getBandSpaces', () => {
    it('밴드 멤버가 요청하면 요청자 밴드 멤버 id 기준으로 목록을 반환한다', async () => {
      let capturedRequester = '';
      const { service } = createService(createRepositoryStub({ onFindSpaces: id => (capturedRequester = id) }));

      const result = await service.getBandSpaces(BAND_ID, USER_ID, listQuery);

      expect(result.items[0]?.spaceId).toBe(SPACE_ID);
      expect(capturedRequester).toBe(REQUESTER_MEMBER_ID);
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ band: null }));

      await expect(service.getBandSpaces(BAND_ID, USER_ID, listQuery)).rejects.toThrow(NotFoundException);
    });

    it('요청자가 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ bandMember: null }));

      await expect(service.getBandSpaces(BAND_ID, USER_ID, listQuery)).rejects.toThrow(ForbiddenException);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않고 그대로 전달한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository, createPrismaServiceFailingTransactionStub());

      await service.getBandSpaces(BAND_ID, USER_ID, listQuery, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('createBandSpace', () => {
    it('요청자를 생성자로 공간을 만들고 밴드 멤버 전원에게 알림을 보낸다', async () => {
      let capturedRequester = '';
      const { service, capturedBatches } = createService(createRepositoryStub({ onCreate: id => (capturedRequester = id) }));

      const result = await service.createBandSpace(BAND_ID, USER_ID, createInput);

      expect(result.spaceId).toBe(SPACE_ID);
      expect(result.createdByBandMemberId).toBe(REQUESTER_MEMBER_ID);
      expect(capturedRequester).toBe(REQUESTER_MEMBER_ID);
      expect(capturedBatches).toHaveLength(1);
      expect(capturedBatches[0]).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'user-001', type: NotificationType.NOTICE }),
          expect.objectContaining({ userId: 'user-002', type: NotificationType.NOTICE }),
        ]),
      );
    });

    it('밴드가 없으면 NotFoundException을 던지고 알림을 보내지 않는다', async () => {
      const { service, capturedBatches } = createService(createRepositoryStub({ band: null }));

      await expect(service.createBandSpace(BAND_ID, USER_ID, createInput)).rejects.toThrow(NotFoundException);
      expect(capturedBatches).toHaveLength(0);
    });

    it('요청자가 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ bandMember: null }));

      await expect(service.createBandSpace(BAND_ID, USER_ID, createInput)).rejects.toThrow(ForbiddenException);
    });

    it('밴드 확인·멤버십 확인·생성을 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({
        onCall: (method, tx) => {
          if (method !== 'findBandMemberUserIds') capturedTransactions.push(tx);
        },
      });
      const { service } = createService(repository);

      await service.createBandSpace(BAND_ID, USER_ID, createInput);

      expectSameTransaction(capturedTransactions, 3);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository, createPrismaServiceFailingTransactionStub());

      await service.createBandSpace(BAND_ID, USER_ID, createInput, externalTx as never);

      expect(capturedTransactions).toHaveLength(4);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('getBandSpaceDetail', () => {
    it('공간이 속한 밴드의 멤버가 요청하면 상세 정보를 반환한다', async () => {
      const { service } = createService(createRepositoryStub());

      const result = await service.getBandSpaceDetail(SPACE_ID, USER_ID);

      expect(result.space.spaceId).toBe(SPACE_ID);
      expect(result.members).toHaveLength(2);
      expect(result.members[0]?.nickname).toBe('김민준');
      expect(result.songCount).toBe(3);
      expect(result.scheduleCount).toBe(2);
    });

    it('공간이 없으면 NotFoundException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ spaceBandId: null }));

      await expect(service.getBandSpaceDetail(SPACE_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('요청자가 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ bandMember: null }));

      await expect(service.getBandSpaceDetail(SPACE_ID, USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('외부 transaction client가 있으면 모든 repository 호출에 그대로 전달한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository, createPrismaServiceFailingTransactionStub());

      await service.getBandSpaceDetail(SPACE_ID, USER_ID, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('updateBandSpace', () => {
    const updateInput = { name: '수정된 공간명' };

    it('밴드 멤버가 요청하면 수정 결과를 반환한다', async () => {
      const { service } = createService(createRepositoryStub());

      const result = await service.updateBandSpace(SPACE_ID, USER_ID, updateInput);

      expect(result.spaceId).toBe(SPACE_ID);
      expect(result.name).toBe('수정된 공간명');
    });

    it('공간이 없으면 NotFoundException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ spaceBandId: null }));

      await expect(service.updateBandSpace(SPACE_ID, USER_ID, updateInput)).rejects.toThrow(NotFoundException);
    });

    it('요청자가 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ bandMember: null }));

      await expect(service.updateBandSpace(SPACE_ID, USER_ID, updateInput)).rejects.toThrow(ForbiddenException);
    });

    it('공간 확인·멤버십 확인·수정을 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository);

      await service.updateBandSpace(SPACE_ID, USER_ID, updateInput);

      expectSameTransaction(capturedTransactions, 3);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository, createPrismaServiceFailingTransactionStub());

      await service.updateBandSpace(SPACE_ID, USER_ID, updateInput, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('deleteBandSpace', () => {
    it('밴드 멤버가 요청하면 삭제 결과(spaceId, deletedAt)를 반환한다', async () => {
      const { service } = createService(createRepositoryStub());

      const result = await service.deleteBandSpace(SPACE_ID, USER_ID);

      expect(result).toEqual({ spaceId: SPACE_ID, deletedAt: '2026-05-29T10:00:00.000Z' });
    });

    it('공간이 없으면 NotFoundException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ spaceBandId: null }));

      await expect(service.deleteBandSpace(SPACE_ID, USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('요청자가 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ bandMember: null }));

      await expect(service.deleteBandSpace(SPACE_ID, USER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('공간 확인·멤버십 확인·삭제를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository);

      await service.deleteBandSpace(SPACE_ID, USER_ID);

      expectSameTransaction(capturedTransactions, 3);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository, createPrismaServiceFailingTransactionStub());

      await service.deleteBandSpace(SPACE_ID, USER_ID, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('addBandSpaceMember', () => {
    const addInput = { bandMemberId: TARGET_BAND_MEMBER_ID, role: 'MEMBER' as const };

    it('밴드 멤버가 요청하면 멤버를 추가하고 추가된 멤버에게 알림을 보낸다', async () => {
      const { service, capturedNotifications } = createService(createRepositoryStub());

      const result = await service.addBandSpaceMember(SPACE_ID, USER_ID, addInput);

      expect(result.memberId).toBe(SPACE_MEMBER_ID);
      expect(result.bandMemberId).toBe(TARGET_BAND_MEMBER_ID);
      expect(result).not.toHaveProperty('spaceName');
      expect(capturedNotifications).toHaveLength(1);
      expect(capturedNotifications[0]).toEqual(
        expect.objectContaining({ userId: ADDED_USER_ID, type: NotificationType.NOTICE, targetPath: `/bandspaces/${SPACE_ID}` }),
      );
    });

    it('공간이 없으면 NotFoundException을 던지고 알림을 보내지 않는다', async () => {
      const { service, capturedNotifications } = createService(createRepositoryStub({ spaceBandId: null }));

      await expect(service.addBandSpaceMember(SPACE_ID, USER_ID, addInput)).rejects.toThrow(NotFoundException);
      expect(capturedNotifications).toHaveLength(0);
    });

    it('요청자가 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ bandMember: null }));

      await expect(service.addBandSpaceMember(SPACE_ID, USER_ID, addInput)).rejects.toThrow(ForbiddenException);
    });

    it('공간 확인·멤버십 확인·추가를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository);

      await service.addBandSpaceMember(SPACE_ID, USER_ID, addInput);

      expectSameTransaction(capturedTransactions, 3);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository, createPrismaServiceFailingTransactionStub());

      await service.addBandSpaceMember(SPACE_ID, USER_ID, addInput, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('updateBandSpaceMemberRole', () => {
    const roleInput = { role: 'LEADER' as const };

    it('밴드 멤버가 요청하면 역할을 수정하고 대상 멤버에게 알림을 보낸다', async () => {
      const { service, capturedNotifications } = createService(createRepositoryStub());

      const result = await service.updateBandSpaceMemberRole(SPACE_ID, USER_ID, SPACE_MEMBER_ID, roleInput);

      expect(result.memberId).toBe(SPACE_MEMBER_ID);
      expect(result.role).toBe('LEADER');
      expect(result).not.toHaveProperty('spaceName');
      expect(capturedNotifications[0]).toEqual(expect.objectContaining({ userId: ADDED_USER_ID, type: NotificationType.NOTICE }));
    });

    it('공간이 없으면 NotFoundException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ spaceBandId: null }));

      await expect(service.updateBandSpaceMemberRole(SPACE_ID, USER_ID, SPACE_MEMBER_ID, roleInput)).rejects.toThrow(NotFoundException);
    });

    it('요청자가 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ bandMember: null }));

      await expect(service.updateBandSpaceMemberRole(SPACE_ID, USER_ID, SPACE_MEMBER_ID, roleInput)).rejects.toThrow(ForbiddenException);
    });

    it('공간 확인·멤버십 확인·역할 수정을 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository);

      await service.updateBandSpaceMemberRole(SPACE_ID, USER_ID, SPACE_MEMBER_ID, roleInput);

      expectSameTransaction(capturedTransactions, 3);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository, createPrismaServiceFailingTransactionStub());

      await service.updateBandSpaceMemberRole(SPACE_ID, USER_ID, SPACE_MEMBER_ID, roleInput, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('removeBandSpaceMember', () => {
    it('밴드 멤버가 요청하면 멤버를 제거하고 제거된 멤버에게 알림을 보낸다', async () => {
      const { service, capturedNotifications } = createService(createRepositoryStub());

      const result = await service.removeBandSpaceMember(SPACE_ID, USER_ID, SPACE_MEMBER_ID);

      expect(result).toEqual({ memberId: SPACE_MEMBER_ID, spaceId: SPACE_ID, removedAt: '2026-05-29T10:00:00.000Z' });
      expect(capturedNotifications[0]).toEqual(expect.objectContaining({ userId: ADDED_USER_ID, type: NotificationType.NOTICE }));
    });

    it('공간이 없으면 NotFoundException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ spaceBandId: null }));

      await expect(service.removeBandSpaceMember(SPACE_ID, USER_ID, SPACE_MEMBER_ID)).rejects.toThrow(NotFoundException);
    });

    it('요청자가 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const { service } = createService(createRepositoryStub({ bandMember: null }));

      await expect(service.removeBandSpaceMember(SPACE_ID, USER_ID, SPACE_MEMBER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('공간 확인·멤버십 확인·제거를 같은 transaction client로 실행한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository);

      await service.removeBandSpaceMember(SPACE_ID, USER_ID, SPACE_MEMBER_ID);

      expectSameTransaction(capturedTransactions, 3);
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createRepositoryStub({ onCall: (_method, tx) => capturedTransactions.push(tx) });
      const { service } = createService(repository, createPrismaServiceFailingTransactionStub());

      await service.removeBandSpaceMember(SPACE_ID, USER_ID, SPACE_MEMBER_ID, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });
});

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';

import { NotificationType, ScheduleStatus, ScheduleType } from '../../generated/prisma';
import type { NotificationsService } from '../notifications/notifications.service';

import type { SchedulesRepository } from './repositories/schedules.repository';
import type { GetBandSchedulesResult } from './types/band-schedule-list-item.type';
import type { CreateScheduleResult } from './types/create-schedule-result.type';
import type { GetScheduleDetailResult } from './types/schedule-detail.type';
import type { GetSpaceSchedulesResult } from './types/schedule-list-item.type';
import type { UpdateScheduleResult } from './types/update-schedule-result.type';
import { SchedulesService } from './schedules.service';

const BAND_SPACE_ID = '11111111-1111-4111-8111-111111111111';
const SCHEDULE_ID = '22222222-2222-4222-8222-222222222222';
const BAND_ID = '33333333-3333-4333-8333-333333333333';
const BAND_MEMBER_ID = '44444444-4444-4444-8444-444444444444';
const TEAM_ID = '77777777-7777-4777-8777-777777777777';
const VOCAL_SKILL_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const GUITAR_SKILL_ID = '99999999-9999-4999-8999-999999999999';
const UNKNOWN_SKILL_ID = '88888888-8888-4888-8888-888888888888';
const USER_ID = '66666666-6666-4666-8666-666666666666';
const SONG_ID = '55555555-5555-4555-8555-555555555555';
const MEMBER_USER_ID_1 = 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const MEMBER_USER_ID_2 = 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const createScheduleResult: CreateScheduleResult = {
  scheduleId: SCHEDULE_ID,
  spaceId: BAND_SPACE_ID,
  placeId: null,
  createdByBandMemberId: BAND_MEMBER_ID,
  scheduleType: 'PRACTICE',
  title: '좋은 날 합주',
  startAt: '2026-06-01T14:00:00.000Z',
  endAt: '2026-06-01T16:00:00.000Z',
  status: 'PLANNED',
  songs: [],
  participantCount: 0,
  teamId: null,
  memo: null,
  externalLinks: [],
  referenceFiles: [],
  createdAt: '2026-05-29T00:00:00.000Z',
};

const updateScheduleResult: UpdateScheduleResult = {
  scheduleId: SCHEDULE_ID,
  spaceId: BAND_SPACE_ID,
  scheduleType: 'PRACTICE',
  title: '수정된 합주',
  startAt: '2026-06-01T15:00:00.000Z',
  endAt: '2026-06-01T17:00:00.000Z',
  placeId: null,
  status: 'PLANNED',
  songIds: [SONG_ID],
  participantCount: 2,
  memo: null,
  externalLinks: [],
  referenceFiles: [],
  updatedAt: '2026-05-29T01:00:00.000Z',
};

const scheduleDetailResult: GetScheduleDetailResult = {
  schedule: {
    scheduleId: SCHEDULE_ID,
    spaceId: BAND_SPACE_ID,
    scheduleType: 'PRACTICE',
    title: '좋은 날 합주',
    startAt: '2026-06-01T14:00:00.000Z',
    endAt: '2026-06-01T16:00:00.000Z',
    status: 'PLANNED',
    place: null,
    songs: [{ songId: SONG_ID, title: '좋은 날', artistName: 'IU', key: 'F_SHARP_MINOR' }],
    participants: [
      {
        participantId: 'p-001',
        bandMemberId: BAND_MEMBER_ID,
        userId: USER_ID,
        nickname: '준혁',
        avatarUrl: null,
        attendanceStatus: 'PENDING',
        note: null,
        skillType: { skillTypeId: VOCAL_SKILL_ID, name: '보컬' },
      },
    ],
    memo: null,
    externalLinks: [],
    referenceFiles: [],
    createdByBandMemberId: BAND_MEMBER_ID,
    isMine: true,
    createdAt: '2026-05-29T00:00:00.000Z',
    updatedAt: '2026-05-29T00:00:00.000Z',
  },
};

const spaceSchedulesResult: GetSpaceSchedulesResult = {
  items: [
    {
      scheduleId: SCHEDULE_ID,
      spaceId: BAND_SPACE_ID,
      scheduleType: 'PRACTICE',
      title: '좋은 날 합주',
      startAt: '2026-06-01T14:00:00.000Z',
      endAt: '2026-06-01T16:00:00.000Z',
      place: null,
      team: null,
      songs: [],
      participantCount: 1,
      participants: [{ bandMemberId: BAND_MEMBER_ID, nickname: '준혁', profileImageUrl: null }],
      memo: null,
      status: 'PLANNED',
      isMine: true,
    },
  ],
  meta: { count: 1, take: 50, cursor: { startAt: '2026-06-01T14:00:00.000Z', id: SCHEDULE_ID }, next: null },
};

const bandSchedulesResult: GetBandSchedulesResult = {
  items: [
    {
      scheduleId: SCHEDULE_ID,
      spaceId: BAND_SPACE_ID,
      space: { spaceId: BAND_SPACE_ID, name: '2026 하계공연 준비' },
      scheduleType: 'PRACTICE',
      title: '좋은 날 합주',
      startAt: '2026-06-01T14:00:00.000Z',
      endAt: '2026-06-01T16:00:00.000Z',
      status: 'PLANNED',
      isMine: false,
    },
  ],
  meta: { count: 1, take: 50, cursor: { startAt: '2026-06-01T14:00:00.000Z', id: SCHEDULE_ID }, next: null },
};

function createRepositoryStub(overrides?: Partial<SchedulesRepository>): SchedulesRepository {
  return {
    async createSchedule() {
      return createScheduleResult;
    },
    async updateSchedule() {
      return updateScheduleResult;
    },
    async deleteSchedule() {},
    async findSchedulesBySpaceId() {
      return spaceSchedulesResult;
    },
    async findSchedulesByBandId() {
      return bandSchedulesResult;
    },
    async findScheduleById(scheduleId) {
      return scheduleId === SCHEDULE_ID ? scheduleDetailResult : undefined;
    },
    async findBandSpaceById(bandSpaceId) {
      return bandSpaceId === BAND_SPACE_ID ? { id: BAND_SPACE_ID } : null;
    },
    async findBandById(bandId) {
      return bandId === BAND_ID ? { id: BAND_ID } : null;
    },
    async findBandMemberByBandSpaceIdAndUserId(bandSpaceId, userId) {
      return bandSpaceId === BAND_SPACE_ID && userId === USER_ID ? { id: BAND_MEMBER_ID } : null;
    },
    async findTeamInSameBandAsSpace(teamId, bandSpaceId) {
      return teamId === TEAM_ID && bandSpaceId === BAND_SPACE_ID ? { id: TEAM_ID } : null;
    },
    async findExistingSkillTypeIds(skillTypeIds) {
      return skillTypeIds.filter(id => id === VOCAL_SKILL_ID || id === GUITAR_SKILL_ID);
    },
    async findSpaceMemberUserIds() {
      return [MEMBER_USER_ID_1, MEMBER_USER_ID_2];
    },
    ...overrides,
  };
}

function createPrismaServiceStub(): PrismaService {
  const tx = { transactionClient: true };
  return {
    async $transaction(callback: (tx: unknown) => Promise<unknown>) {
      return callback(tx);
    },
  } as PrismaService;
}

function createPrismaServiceFailingTransactionStub(): PrismaService {
  return {
    async $transaction() {
      throw new Error('외부 tx가 있으면 새 transaction을 열지 않아야 합니다.');
    },
  } as unknown as PrismaService;
}

function createNotificationsServiceMock(): jest.Mocked<Pick<NotificationsService, 'createManyNotifications'>> & NotificationsService {
  return {
    createManyNotifications: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<Pick<NotificationsService, 'createManyNotifications'>> & NotificationsService;
}

describe('SchedulesService', () => {
  describe('createSchedule', () => {
    it('일정 생성 결과를 반환한다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      const result = await service.createSchedule(BAND_SPACE_ID, USER_ID, {
        title: '좋은 날 합주',
        scheduleType: ScheduleType.PRACTICE,
        startAt: '2026-06-01T14:00:00+09:00',
        endAt: '2026-06-01T16:00:00+09:00',
        status: ScheduleStatus.PLANNED,
      });

      expect(result.scheduleId).toBe(SCHEDULE_ID);
      expect(result.spaceId).toBe(BAND_SPACE_ID);
    });

    it('일정 생성 시 합주 공간 멤버 전원에게 알림을 전송한다', async () => {
      const notificationsMock = createNotificationsServiceMock();
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), notificationsMock);

      await service.createSchedule(BAND_SPACE_ID, USER_ID, {
        title: '좋은 날 합주',
        scheduleType: ScheduleType.PRACTICE,
        startAt: '2026-06-01T14:00:00+09:00',
        endAt: '2026-06-01T16:00:00+09:00',
        status: ScheduleStatus.PLANNED,
      });

      expect(notificationsMock.createManyNotifications).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: MEMBER_USER_ID_1, type: NotificationType.NOTICE }),
          expect.objectContaining({ userId: MEMBER_USER_ID_2, type: NotificationType.NOTICE }),
        ]),
      );
    });

    it('밴드 공간이 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(
        service.createSchedule('missing-space-id', USER_ID, {
          title: '합주',
          scheduleType: ScheduleType.PRACTICE,
          startAt: '2026-06-01T14:00:00+09:00',
          endAt: '2026-06-01T16:00:00+09:00',
          status: ScheduleStatus.PLANNED,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('공간 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(
        service.createSchedule(BAND_SPACE_ID, 'non-member-user-id', {
          title: '합주',
          scheduleType: ScheduleType.PRACTICE,
          startAt: '2026-06-01T14:00:00+09:00',
          endAt: '2026-06-01T16:00:00+09:00',
          status: ScheduleStatus.PLANNED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('teamId가 해당 밴드의 팀이 아니면 BadRequestException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(
        service.createSchedule(BAND_SPACE_ID, USER_ID, {
          title: '합주',
          scheduleType: ScheduleType.PRACTICE,
          startAt: '2026-06-01T14:00:00+09:00',
          endAt: '2026-06-01T16:00:00+09:00',
          status: ScheduleStatus.PLANNED,
          teamId: '00000000-0000-4000-8000-000000000000',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('endAt이 startAt보다 이전이면 BadRequestException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(
        service.createSchedule(BAND_SPACE_ID, USER_ID, {
          title: '합주',
          scheduleType: ScheduleType.PRACTICE,
          startAt: '2026-06-01T16:00:00+09:00',
          endAt: '2026-06-01T14:00:00+09:00',
          status: ScheduleStatus.PLANNED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('participants로 넘긴 세션 배정을 그대로 Repository에 전달한다', async () => {
      let captured: unknown;
      const service = new SchedulesService(
        createRepositoryStub({
          async createSchedule(_spaceId, _memberId, input) {
            captured = input.participants;
            return createScheduleResult;
          },
        }),
        createPrismaServiceStub(),
        createNotificationsServiceMock(),
      );

      await service.createSchedule(BAND_SPACE_ID, USER_ID, {
        title: '합주',
        scheduleType: ScheduleType.PRACTICE,
        startAt: '2026-06-01T14:00:00+09:00',
        endAt: '2026-06-01T16:00:00+09:00',
        status: ScheduleStatus.PLANNED,
        participants: [
          { bandMemberId: BAND_MEMBER_ID, skillTypeId: VOCAL_SKILL_ID },
          { bandMemberId: BAND_MEMBER_ID, skillTypeId: GUITAR_SKILL_ID },
        ],
      });

      expect(captured).toEqual([
        { bandMemberId: BAND_MEMBER_ID, skillTypeId: VOCAL_SKILL_ID },
        { bandMemberId: BAND_MEMBER_ID, skillTypeId: GUITAR_SKILL_ID },
      ]);
    });

    it('존재하지 않는 세션이면 BadRequestException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(
        service.createSchedule(BAND_SPACE_ID, USER_ID, {
          title: '합주',
          scheduleType: ScheduleType.PRACTICE,
          startAt: '2026-06-01T14:00:00+09:00',
          endAt: '2026-06-01T16:00:00+09:00',
          status: ScheduleStatus.PLANNED,
          participants: [{ bandMemberId: BAND_MEMBER_ID, skillTypeId: UNKNOWN_SKILL_ID }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('회의에 세션을 배정하면 BadRequestException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(
        service.createSchedule(BAND_SPACE_ID, USER_ID, {
          title: '회의',
          scheduleType: ScheduleType.MEETING,
          startAt: '2026-06-01T14:00:00+09:00',
          endAt: '2026-06-01T16:00:00+09:00',
          status: ScheduleStatus.PLANNED,
          participants: [{ bandMemberId: BAND_MEMBER_ID, skillTypeId: VOCAL_SKILL_ID }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('participants가 null로 오면 참여자를 건드리지 않는다(500 방지)', async () => {
      // @IsOptional()은 null도 검증에서 빼주므로 null이 그대로 Service까지 온다.
      let captured: unknown = 'unset';
      const service = new SchedulesService(
        createRepositoryStub({
          async createSchedule(_spaceId, _memberId, input) {
            captured = input.participants;
            return createScheduleResult;
          },
        }),
        createPrismaServiceStub(),
        createNotificationsServiceMock(),
      );

      await service.createSchedule(BAND_SPACE_ID, USER_ID, {
        title: '합주',
        scheduleType: ScheduleType.PRACTICE,
        startAt: '2026-06-01T14:00:00+09:00',
        endAt: '2026-06-01T16:00:00+09:00',
        status: ScheduleStatus.PLANNED,
        participants: null as never,
      });

      expect(captured).toEqual([]);
    });

    it('skillTypeId가 null이면 세션 배정으로 보지 않는다', async () => {
      // @IsOptional()이 null을 통과시키므로 Service까지 null이 온다.
      // 걸러내지 않으면 회의에서 헛된 400, 합주에서는 `in: [null]`로 500이 난다.
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(
        service.createSchedule(BAND_SPACE_ID, USER_ID, {
          title: '회의',
          scheduleType: ScheduleType.MEETING,
          startAt: '2026-06-01T14:00:00+09:00',
          endAt: '2026-06-01T16:00:00+09:00',
          status: ScheduleStatus.PLANNED,
          participants: [{ bandMemberId: BAND_MEMBER_ID, skillTypeId: null as never }],
        }),
      ).resolves.toBeDefined();
    });

    it('createSchedule 내부 호출이 같은 tx로 처리된다', async () => {
      const capturedTransactions: unknown[] = [];
      const stub = createRepositoryStub({
        async findBandSpaceById(_id, tx) {
          capturedTransactions.push(tx);
          return { id: BAND_SPACE_ID };
        },
        async findBandMemberByBandSpaceIdAndUserId(_spaceId, _userId, tx) {
          capturedTransactions.push(tx);
          return { id: BAND_MEMBER_ID };
        },
        async createSchedule(_spaceId, _memberId, _input, tx) {
          capturedTransactions.push(tx);
          return createScheduleResult;
        },
      });
      const service = new SchedulesService(stub, createPrismaServiceStub(), createNotificationsServiceMock());

      await service.createSchedule(BAND_SPACE_ID, USER_ID, {
        title: '합주',
        scheduleType: ScheduleType.PRACTICE,
        startAt: '2026-06-01T14:00:00+09:00',
        endAt: '2026-06-01T16:00:00+09:00',
        status: ScheduleStatus.PLANNED,
      });

      expect(capturedTransactions).toHaveLength(3);
      expect(capturedTransactions[0]).toBe(capturedTransactions[1]);
      expect(capturedTransactions[1]).toBe(capturedTransactions[2]);
    });

    it('외부 tx가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { externalTransactionClient: true } as any;
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceFailingTransactionStub(), createNotificationsServiceMock());

      await expect(
        service.createSchedule(
          BAND_SPACE_ID,
          USER_ID,
          {
            title: '합주',
            scheduleType: ScheduleType.PRACTICE,
            startAt: '2026-06-01T14:00:00+09:00',
            endAt: '2026-06-01T16:00:00+09:00',
            status: ScheduleStatus.PLANNED,
          },
          externalTx,
        ),
      ).resolves.toBeDefined();
    });
  });

  describe('updateSchedule', () => {
    it('수정 결과를 반환한다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      const result = await service.updateSchedule(SCHEDULE_ID, { title: '수정된 합주' });

      expect(result.scheduleId).toBe(SCHEDULE_ID);
      expect(result.updatedAt).toBeDefined();
    });

    it('일정이 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(service.updateSchedule('missing-schedule-id', { title: '수정' })).rejects.toThrow(NotFoundException);
    });

    it('endAt만 변경 시 기존 startAt보다 이전이면 BadRequestException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(service.updateSchedule(SCHEDULE_ID, { endAt: '2026-06-01T10:00:00+09:00' })).rejects.toThrow(BadRequestException);
    });

    it('합주를 회의로 바꾸면서 세션을 함께 보내면 BadRequestException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(
        service.updateSchedule(SCHEDULE_ID, {
          scheduleType: ScheduleType.MEETING,
          participants: [{ bandMemberId: BAND_MEMBER_ID, skillTypeId: VOCAL_SKILL_ID }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('유형을 안 보내면 기존 유형(합주) 기준으로 세션 배정을 허용한다', async () => {
      let captured: unknown;
      const service = new SchedulesService(
        createRepositoryStub({
          async updateSchedule(_scheduleId, input) {
            captured = input.participants;
            return updateScheduleResult;
          },
        }),
        createPrismaServiceStub(),
        createNotificationsServiceMock(),
      );

      await service.updateSchedule(SCHEDULE_ID, {
        participants: [{ bandMemberId: BAND_MEMBER_ID, skillTypeId: VOCAL_SKILL_ID }],
      });

      expect(captured).toEqual([{ bandMemberId: BAND_MEMBER_ID, skillTypeId: VOCAL_SKILL_ID }]);
    });

    it('updateSchedule 내부 호출이 같은 tx로 처리된다', async () => {
      const capturedTransactions: unknown[] = [];
      const stub = createRepositoryStub({
        async findScheduleById(id, _userId, tx) {
          capturedTransactions.push(tx);
          return id === SCHEDULE_ID ? scheduleDetailResult : undefined;
        },
        async updateSchedule(_id, _input, tx) {
          capturedTransactions.push(tx);
          return updateScheduleResult;
        },
      });
      const service = new SchedulesService(stub, createPrismaServiceStub(), createNotificationsServiceMock());

      await service.updateSchedule(SCHEDULE_ID, { title: '수정' });

      expect(capturedTransactions).toHaveLength(2);
      expect(capturedTransactions[0]).toBe(capturedTransactions[1]);
    });

    it('외부 tx가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { externalTransactionClient: true } as any;
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceFailingTransactionStub(), createNotificationsServiceMock());

      await expect(service.updateSchedule(SCHEDULE_ID, { title: '수정' }, externalTx)).resolves.toBeDefined();
    });
  });

  describe('deleteSchedule', () => {
    it('scheduleId와 deletedAt을 반환한다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      const result = await service.deleteSchedule(SCHEDULE_ID);

      expect(result.scheduleId).toBe(SCHEDULE_ID);
      expect(result.deletedAt).toBeDefined();
    });

    it('일정 삭제 시 합주 공간 멤버 전원에게 알림을 전송한다', async () => {
      const notificationsMock = createNotificationsServiceMock();
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), notificationsMock);

      await service.deleteSchedule(SCHEDULE_ID);

      expect(notificationsMock.createManyNotifications).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: MEMBER_USER_ID_1, type: NotificationType.NOTICE }),
          expect.objectContaining({ userId: MEMBER_USER_ID_2, type: NotificationType.NOTICE }),
        ]),
      );
    });

    it('일정이 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(service.deleteSchedule('missing-schedule-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSpaceSchedules', () => {
    it('items와 meta를 반환한다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      const result = await service.getSpaceSchedules(BAND_SPACE_ID, USER_ID, {});

      expect(result.items).toHaveLength(1);
      expect(result.meta.cursor).toBeDefined();
    });

    it('밴드 공간이 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(service.getSpaceSchedules('missing-space-id', USER_ID, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBandSchedules', () => {
    it('items와 meta를 반환한다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      const result = await service.getBandSchedules(BAND_ID, USER_ID, {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.space).toBeDefined();
    });

    it('밴드가 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(service.getBandSchedules('missing-band-id', USER_ID, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('getScheduleDetail', () => {
    it('schedule 상세를 반환한다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      const result = await service.getScheduleDetail(SCHEDULE_ID, USER_ID);

      expect(result.schedule.scheduleId).toBe(SCHEDULE_ID);
      expect(result.schedule.participants).toHaveLength(1);
      expect(result.schedule.songs).toHaveLength(1);
    });

    it('일정이 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulesService(createRepositoryStub(), createPrismaServiceStub(), createNotificationsServiceMock());

      await expect(service.getScheduleDetail('missing-schedule-id', USER_ID)).rejects.toThrow(NotFoundException);
    });
  });
});

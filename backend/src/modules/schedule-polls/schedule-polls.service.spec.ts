import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';
import { BandMemberRole } from 'src/generated/prisma';

import type { CreateSchedulePollInput } from './dto/create-schedule-poll.dto';
import type { SchedulePollsRepository } from './repositories/schedule-polls.repository';
import type { SchedulePollData, SchedulePollListItem } from './types/schedule-poll.type';
import { SchedulePollsService } from './schedule-polls.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const BAND_SPACE_ID = '22222222-2222-4222-8222-222222222222';
const BAND_MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const SCHEDULE_POLL_ID = '44444444-4444-4444-8444-444444444444';
const OPTION_ID_1 = '55555555-5555-4555-8555-555555555555';
const OPTION_ID_2 = '66666666-6666-4666-8666-666666666666';
const OTHER_MEMBER_ID = '77777777-7777-4777-8777-777777777777';

// 마감 검증이 현재 시각 기준이라 고정 날짜를 쓰면 시간이 지나며 테스트가 썩는다. 실행 시점 기준으로 계산한다.
const FUTURE_CLOSES_AT = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const PAST_CLOSES_AT = new Date(Date.now() - 60 * 60 * 1000).toISOString();

const DEFAULT_INPUT: CreateSchedulePollInput = {
  name: '좋은 날 오프닝 연습',
  closesAt: FUTURE_CLOSES_AT,
  options: [
    { startAt: '2026-09-13T12:00:00.000Z', endAt: '2026-09-13T14:00:00.000Z' },
    { startAt: '2026-09-14T12:00:00.000Z', endAt: '2026-09-14T14:00:00.000Z' },
  ],
};

const DEFAULT_POLL: SchedulePollData = {
  schedulePollId: SCHEDULE_POLL_ID,
  bandSpaceId: BAND_SPACE_ID,
  createdByBandMemberId: BAND_MEMBER_ID,
  name: '좋은 날 오프닝 연습',
  closesAt: FUTURE_CLOSES_AT,
  options: [
    {
      schedulePollOptionId: OPTION_ID_1,
      startAt: '2026-09-13T12:00:00.000Z',
      endAt: '2026-09-13T14:00:00.000Z',
      voters: [
        { bandMemberId: BAND_MEMBER_ID, userId: USER_ID, nickname: '준혁', avatarUrl: null },
        { bandMemberId: OTHER_MEMBER_ID, userId: '88888888-8888-4888-8888-888888888888', nickname: '단비', avatarUrl: null },
      ],
    },
    {
      schedulePollOptionId: OPTION_ID_2,
      startAt: '2026-09-14T12:00:00.000Z',
      endAt: '2026-09-14T14:00:00.000Z',
      voters: [{ bandMemberId: BAND_MEMBER_ID, userId: USER_ID, nickname: '준혁', avatarUrl: null }],
    },
  ],
  myOptionIds: [OPTION_ID_1, OPTION_ID_2],
  createdAt: '2026-09-07T00:00:00.000Z',
  updatedAt: '2026-09-07T00:00:00.000Z',
};

const DEFAULT_POLL_LIST_ITEM: SchedulePollListItem = {
  schedulePollId: SCHEDULE_POLL_ID,
  bandSpaceId: BAND_SPACE_ID,
  createdByBandMemberId: BAND_MEMBER_ID,
  name: '좋은 날 오프닝 연습',
  closesAt: FUTURE_CLOSES_AT,
  optionStartAts: ['2026-09-13T12:00:00.000Z', '2026-09-14T12:00:00.000Z'],
  optionCount: 2,
  voterCount: 2,
  hasVoted: true,
  createdAt: '2026-09-07T00:00:00.000Z',
  updatedAt: '2026-09-07T00:00:00.000Z',
};

function createPrismaServiceStub(): PrismaService {
  const transactionClient = { transactionClient: true };

  return {
    async $transaction(callback: (tx: unknown) => Promise<unknown>) {
      return callback(transactionClient);
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

function createSchedulePollsRepositoryStub(options?: {
  bandSpace?: { id: string } | null;
  member?: { id: string; role: BandMemberRole } | null;
  context?: { bandSpaceId: string; createdByBandMemberId: string | null; closesAt: Date } | null;
  poll?: SchedulePollData | null;
  matchingOptionCount?: number;
  onCall?: (method: string, tx: unknown) => void;
  onReplaceVotes?: (optionIds: string[]) => void;
  onDelete?: (schedulePollId: string) => void;
}): SchedulePollsRepository {
  return {
    async findActiveBandSpaceById(_bandSpaceId, tx) {
      options?.onCall?.('findActiveBandSpaceById', tx);
      return options?.bandSpace !== undefined ? options.bandSpace : { id: BAND_SPACE_ID };
    },
    async findBandMemberByBandSpaceIdAndUserId(_bandSpaceId, _userId, tx) {
      options?.onCall?.('findBandMemberByBandSpaceIdAndUserId', tx);
      return options?.member !== undefined ? options.member : { id: BAND_MEMBER_ID, role: BandMemberRole.MEMBER };
    },
    async lockBandMemberForVote(_bandMemberId, tx) {
      options?.onCall?.('lockBandMemberForVote', tx);
    },
    async createSchedulePoll(_bandSpaceId, _createdByBandMemberId, _input, tx) {
      options?.onCall?.('createSchedulePoll', tx);
      return options?.poll ?? DEFAULT_POLL;
    },
    async findSchedulePollContextById(_schedulePollId, tx) {
      options?.onCall?.('findSchedulePollContextById', tx);
      return options?.context !== undefined
        ? options.context
        : { bandSpaceId: BAND_SPACE_ID, createdByBandMemberId: BAND_MEMBER_ID, closesAt: new Date(FUTURE_CLOSES_AT) };
    },
    async findSchedulePollById(_schedulePollId, _currentBandMemberId, tx) {
      options?.onCall?.('findSchedulePollById', tx);
      return options?.poll !== undefined ? options.poll : DEFAULT_POLL;
    },
    async findSchedulePollsByBandSpaceId(_bandSpaceId, _currentBandMemberId, tx) {
      options?.onCall?.('findSchedulePollsByBandSpaceId', tx);
      return [DEFAULT_POLL_LIST_ITEM];
    },
    async countSchedulePollOptionsByIds(_schedulePollId, optionIds, tx) {
      options?.onCall?.('countSchedulePollOptionsByIds', tx);
      return options?.matchingOptionCount ?? optionIds.length;
    },
    async replaceSchedulePollVotes(_schedulePollId, _bandMemberId, optionIds, tx) {
      options?.onCall?.('replaceSchedulePollVotes', tx);
      options?.onReplaceVotes?.(optionIds);
    },
    async deleteSchedulePoll(schedulePollId, tx) {
      options?.onCall?.('deleteSchedulePoll', tx);
      options?.onDelete?.(schedulePollId);
    },
  };
}

describe('SchedulePollsService', () => {
  describe('createSchedulePoll', () => {
    it('합주 공간이 속한 밴드의 멤버가 일정 조율 투표를 생성한다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());

      const result = await service.createSchedulePoll(USER_ID, BAND_SPACE_ID, DEFAULT_INPUT);

      expect(result.schedulePollId).toBe(SCHEDULE_POLL_ID);
      expect(result.name).toBe('좋은 날 오프닝 연습');
      expect(result.closesAt).toBe(FUTURE_CLOSES_AT);
      expect(result.voterCount).toBe(2);
      expect(result.options[0].isRecommended).toBe(true);
      expect(result.options[1].isRecommended).toBe(false);
    });

    it('마감 기한이 현재 시각 이후가 아니면 BadRequestException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());
      const input = { ...DEFAULT_INPUT, closesAt: PAST_CLOSES_AT };

      await expect(service.createSchedulePoll(USER_ID, BAND_SPACE_ID, input)).rejects.toThrow(BadRequestException);
    });

    it('합주 공간이 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ bandSpace: null }), createPrismaServiceStub());

      await expect(service.createSchedulePoll(USER_ID, BAND_SPACE_ID, DEFAULT_INPUT)).rejects.toThrow(NotFoundException);
    });

    it('합주 공간이 속한 밴드의 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ member: null }), createPrismaServiceStub());

      await expect(service.createSchedulePoll(USER_ID, BAND_SPACE_ID, DEFAULT_INPUT)).rejects.toThrow(ForbiddenException);
    });

    it('후보 종료 시간이 시작 시간보다 늦지 않으면 BadRequestException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());
      const input = { ...DEFAULT_INPUT, options: [{ startAt: '2026-09-13T14:00:00.000Z', endAt: '2026-09-13T12:00:00.000Z' }] };

      await expect(service.createSchedulePoll(USER_ID, BAND_SPACE_ID, input)).rejects.toThrow(BadRequestException);
    });

    it('같은 후보 시간이 중복되면 BadRequestException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());
      const input = { ...DEFAULT_INPUT, options: [DEFAULT_INPUT.options[0], DEFAULT_INPUT.options[0]] };

      await expect(service.createSchedulePoll(USER_ID, BAND_SPACE_ID, input)).rejects.toThrow(BadRequestException);
    });

    it('검증과 생성을 같은 transaction client로 처리한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createSchedulePollsRepositoryStub({
        onCall: (_method, tx) => capturedTransactions.push(tx),
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      await service.createSchedulePoll(USER_ID, BAND_SPACE_ID, DEFAULT_INPUT);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(capturedTransactions[0]));
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: true };
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceFailingTransactionStub());

      await expect(service.createSchedulePoll(USER_ID, BAND_SPACE_ID, DEFAULT_INPUT, externalTx as never)).resolves.toBeDefined();
    });
  });

  describe('getSchedulePoll', () => {
    it('후보별 투표자와 최다 득표 후보를 조회한다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());

      const result = await service.getSchedulePoll(USER_ID, SCHEDULE_POLL_ID);

      expect(result.voterCount).toBe(2);
      expect(result.options[0]).toMatchObject({ voteCount: 2, isRecommended: true });
      expect(result.options[1]).toMatchObject({ voteCount: 1, isRecommended: false });
      expect(result.myOptionIds).toEqual([OPTION_ID_1, OPTION_ID_2]);
    });

    it('최다 득표가 동률이면 동률 후보를 모두 추천한다', async () => {
      const tiedPoll: SchedulePollData = {
        ...DEFAULT_POLL,
        options: DEFAULT_POLL.options.map(option => ({ ...option, voters: option.voters.slice(0, 1) })),
      };
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ poll: tiedPoll }), createPrismaServiceStub());

      const result = await service.getSchedulePoll(USER_ID, SCHEDULE_POLL_ID);

      expect(result.options.every(option => option.isRecommended)).toBe(true);
    });

    it('모든 후보가 0표이면 추천하지 않는다', async () => {
      const emptyPoll: SchedulePollData = {
        ...DEFAULT_POLL,
        options: DEFAULT_POLL.options.map(option => ({ ...option, voters: [] })),
      };
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ poll: emptyPoll }), createPrismaServiceStub());

      const result = await service.getSchedulePoll(USER_ID, SCHEDULE_POLL_ID);

      expect(result.voterCount).toBe(0);
      expect(result.options.every(option => !option.isRecommended)).toBe(true);
    });

    it('일정 투표가 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ context: null }), createPrismaServiceStub());

      await expect(service.getSchedulePoll(USER_ID, SCHEDULE_POLL_ID)).rejects.toThrow(NotFoundException);
    });

    it('합주 공간이 속한 밴드의 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ member: null }), createPrismaServiceStub());

      await expect(service.getSchedulePoll(USER_ID, SCHEDULE_POLL_ID)).rejects.toThrow(ForbiddenException);
    });

    it('외부 transaction client를 모든 Repository 조회에 전달한다', async () => {
      const externalTx = { transactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createSchedulePollsRepositoryStub({
        onCall: (_method, tx) => capturedTransactions.push(tx),
      });
      const service = new SchedulePollsService(repository, createPrismaServiceFailingTransactionStub());

      await service.getSchedulePoll(USER_ID, SCHEDULE_POLL_ID, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('updateMySchedulePollVote', () => {
    it('기존 선택을 요청한 후보 목록으로 교체한다', async () => {
      let capturedOptionIds: string[] = [];
      const repository = createSchedulePollsRepositoryStub({
        onReplaceVotes: optionIds => {
          capturedOptionIds = optionIds;
        },
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      const result = await service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, {
        schedulePollOptionIds: [OPTION_ID_1, OPTION_ID_2],
      });

      expect(capturedOptionIds).toEqual([OPTION_ID_1, OPTION_ID_2]);
      expect(result.schedulePollId).toBe(SCHEDULE_POLL_ID);
    });

    it('빈 후보 목록이면 기존 투표를 철회한다', async () => {
      let capturedOptionIds: string[] = [OPTION_ID_1];
      const repository = createSchedulePollsRepositoryStub({
        onReplaceVotes: optionIds => {
          capturedOptionIds = optionIds;
        },
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      await service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [] });

      expect(capturedOptionIds).toEqual([]);
    });

    it('일정 투표가 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ context: null }), createPrismaServiceStub());

      await expect(service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1] })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('마감된 일정 투표에 투표하면 BadRequestException을 던진다', async () => {
      const repository = createSchedulePollsRepositoryStub({
        context: { bandSpaceId: BAND_SPACE_ID, createdByBandMemberId: BAND_MEMBER_ID, closesAt: new Date(PAST_CLOSES_AT) },
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      await expect(service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1] })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('잠금 대기 중 마감을 넘기면 투표를 반영하지 않고 BadRequestException을 던진다', async () => {
      // 1차 마감 검사는 통과했지만 lockBandMemberForVote 대기 중에 마감을 넘긴 상황을 재현한다.
      const closesAt = new Date('2026-10-05T10:00:00.000Z');
      let lockAcquired = false;
      let votesReplaced = false;
      const repository = createSchedulePollsRepositoryStub({
        context: { bandSpaceId: BAND_SPACE_ID, createdByBandMemberId: BAND_MEMBER_ID, closesAt },
        onCall: method => {
          if (method === 'lockBandMemberForVote') lockAcquired = true;
          if (method === 'replaceSchedulePollVotes') votesReplaced = true;
        },
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());
      const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => (lockAcquired ? closesAt.getTime() + 1_000 : closesAt.getTime() - 60_000));

      try {
        await expect(service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1] })).rejects.toThrow(
          BadRequestException,
        );
        expect(votesReplaced).toBe(false);
      } finally {
        nowSpy.mockRestore();
      }
    });

    it('합주 공간이 속한 밴드의 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ member: null }), createPrismaServiceStub());

      await expect(service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1] })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('중복 후보 ID가 있으면 BadRequestException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());

      await expect(
        service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1, OPTION_ID_1] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('다른 일정 투표의 후보 ID가 있으면 BadRequestException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ matchingOptionCount: 0 }), createPrismaServiceStub());

      await expect(service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1] })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('검증과 투표 교체를 같은 transaction client로 처리한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createSchedulePollsRepositoryStub({
        onCall: (_method, tx) => capturedTransactions.push(tx),
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      await service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1] });

      expect(capturedTransactions).toHaveLength(6);
      capturedTransactions.forEach(tx => expect(tx).toBe(capturedTransactions[0]));
    });

    it('투표 교체 전에 같은 멤버의 동시 요청을 막기 위해 멤버 행을 잠근다', async () => {
      const calledMethods: string[] = [];
      const repository = createSchedulePollsRepositoryStub({
        onCall: method => calledMethods.push(method),
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      await service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1] });

      expect(calledMethods.indexOf('lockBandMemberForVote')).toBeGreaterThanOrEqual(0);
      expect(calledMethods.indexOf('lockBandMemberForVote')).toBeLessThan(calledMethods.indexOf('replaceSchedulePollVotes'));
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: true };
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceFailingTransactionStub());

      await expect(
        service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1] }, externalTx as never),
      ).resolves.toBeDefined();
    });
  });

  describe('getSchedulePolls', () => {
    it('합주 공간의 일정 조율 투표 목록을 조회한다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());

      const result = await service.getSchedulePolls(USER_ID, BAND_SPACE_ID);

      expect(result.items).toEqual([DEFAULT_POLL_LIST_ITEM]);
    });

    it('합주 공간이 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ bandSpace: null }), createPrismaServiceStub());

      await expect(service.getSchedulePolls(USER_ID, BAND_SPACE_ID)).rejects.toThrow(NotFoundException);
    });

    it('합주 공간이 속한 밴드의 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ member: null }), createPrismaServiceStub());

      await expect(service.getSchedulePolls(USER_ID, BAND_SPACE_ID)).rejects.toThrow(ForbiddenException);
    });

    it('외부 transaction client를 모든 Repository 조회에 전달한다', async () => {
      const externalTx = { transactionClient: true };
      const capturedTransactions: unknown[] = [];
      const repository = createSchedulePollsRepositoryStub({
        onCall: (_method, tx) => capturedTransactions.push(tx),
      });
      const service = new SchedulePollsService(repository, createPrismaServiceFailingTransactionStub());

      await service.getSchedulePolls(USER_ID, BAND_SPACE_ID, externalTx as never);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(externalTx));
    });
  });

  describe('deleteSchedulePoll', () => {
    it('투표 생성자가 요청하면 삭제된다', async () => {
      let deletedPollId: string | null = null;
      const repository = createSchedulePollsRepositoryStub({
        onDelete: schedulePollId => {
          deletedPollId = schedulePollId;
        },
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      const result = await service.deleteSchedulePoll(USER_ID, SCHEDULE_POLL_ID);

      expect(deletedPollId).toBe(SCHEDULE_POLL_ID);
      expect(result).toEqual({ schedulePollId: SCHEDULE_POLL_ID });
    });

    it('생성자가 밴드를 떠난 투표도 밴드 리더가 요청하면 삭제된다', async () => {
      let deletedPollId: string | null = null;
      const repository = createSchedulePollsRepositoryStub({
        context: { bandSpaceId: BAND_SPACE_ID, createdByBandMemberId: null, closesAt: new Date(FUTURE_CLOSES_AT) },
        member: { id: OTHER_MEMBER_ID, role: BandMemberRole.BM },
        onDelete: schedulePollId => {
          deletedPollId = schedulePollId;
        },
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      await service.deleteSchedulePoll(USER_ID, SCHEDULE_POLL_ID);

      expect(deletedPollId).toBe(SCHEDULE_POLL_ID);
    });

    it('밴드 부리더가 요청하면 삭제된다', async () => {
      const repository = createSchedulePollsRepositoryStub({ member: { id: OTHER_MEMBER_ID, role: BandMemberRole.ADMIN } });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      await expect(service.deleteSchedulePoll(USER_ID, SCHEDULE_POLL_ID)).resolves.toEqual({ schedulePollId: SCHEDULE_POLL_ID });
    });

    it('생성자도 리더·부리더도 아니면 ForbiddenException을 던지고 삭제하지 않는다', async () => {
      let deleteCalled = false;
      const repository = createSchedulePollsRepositoryStub({
        member: { id: OTHER_MEMBER_ID, role: BandMemberRole.MEMBER },
        onDelete: () => {
          deleteCalled = true;
        },
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      await expect(service.deleteSchedulePoll(USER_ID, SCHEDULE_POLL_ID)).rejects.toThrow(ForbiddenException);
      expect(deleteCalled).toBe(false);
    });

    it('일정 투표가 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ context: null }), createPrismaServiceStub());

      await expect(service.deleteSchedulePoll(USER_ID, SCHEDULE_POLL_ID)).rejects.toThrow(NotFoundException);
    });

    it('합주 공간이 속한 밴드의 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ member: null }), createPrismaServiceStub());

      await expect(service.deleteSchedulePoll(USER_ID, SCHEDULE_POLL_ID)).rejects.toThrow(ForbiddenException);
    });

    it('검증과 삭제를 같은 transaction client로 처리한다', async () => {
      const capturedTransactions: unknown[] = [];
      const repository = createSchedulePollsRepositoryStub({
        onCall: (_method, tx) => capturedTransactions.push(tx),
      });
      const service = new SchedulePollsService(repository, createPrismaServiceStub());

      await service.deleteSchedulePoll(USER_ID, SCHEDULE_POLL_ID);

      expect(capturedTransactions).toHaveLength(3);
      capturedTransactions.forEach(tx => expect(tx).toBe(capturedTransactions[0]));
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: true };
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceFailingTransactionStub());

      await expect(service.deleteSchedulePoll(USER_ID, SCHEDULE_POLL_ID, externalTx as never)).resolves.toBeDefined();
    });
  });
});

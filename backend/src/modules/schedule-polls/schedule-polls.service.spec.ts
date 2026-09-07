import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from 'src/database/prisma';

import type { CreateSchedulePollInput } from './dto/create-schedule-poll.dto';
import type { SchedulePollsRepository } from './repositories/schedule-polls.repository';
import type { SchedulePollData } from './types/schedule-poll.type';
import { SchedulePollsService } from './schedule-polls.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const BAND_SPACE_ID = '22222222-2222-4222-8222-222222222222';
const BAND_MEMBER_ID = '33333333-3333-4333-8333-333333333333';
const SCHEDULE_POLL_ID = '44444444-4444-4444-8444-444444444444';
const OPTION_ID_1 = '55555555-5555-4555-8555-555555555555';
const OPTION_ID_2 = '66666666-6666-4666-8666-666666666666';
const OTHER_MEMBER_ID = '77777777-7777-4777-8777-777777777777';

const DEFAULT_INPUT: CreateSchedulePollInput = {
  options: [
    { startAt: '2026-09-13T12:00:00.000Z', endAt: '2026-09-13T14:00:00.000Z' },
    { startAt: '2026-09-14T12:00:00.000Z', endAt: '2026-09-14T14:00:00.000Z' },
  ],
};

const DEFAULT_POLL: SchedulePollData = {
  schedulePollId: SCHEDULE_POLL_ID,
  bandSpaceId: BAND_SPACE_ID,
  createdByBandMemberId: BAND_MEMBER_ID,
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
  member?: { bandMemberId: string } | null;
  context?: { bandSpaceId: string } | null;
  poll?: SchedulePollData | null;
  matchingOptionCount?: number;
  onCall?: (method: string, tx: unknown) => void;
  onReplaceVotes?: (optionIds: string[]) => void;
}): SchedulePollsRepository {
  return {
    async findActiveBandSpaceById(_bandSpaceId, tx) {
      options?.onCall?.('findActiveBandSpaceById', tx);
      return options?.bandSpace !== undefined ? options.bandSpace : { id: BAND_SPACE_ID };
    },
    async findActiveSpaceMemberByUserId(_bandSpaceId, _userId, tx) {
      options?.onCall?.('findActiveSpaceMemberByUserId', tx);
      return options?.member !== undefined ? options.member : { bandMemberId: BAND_MEMBER_ID };
    },
    async createSchedulePoll(_bandSpaceId, _createdByBandMemberId, _input, tx) {
      options?.onCall?.('createSchedulePoll', tx);
      return options?.poll ?? DEFAULT_POLL;
    },
    async findSchedulePollContextById(_schedulePollId, tx) {
      options?.onCall?.('findSchedulePollContextById', tx);
      return options?.context !== undefined ? options.context : { bandSpaceId: BAND_SPACE_ID };
    },
    async findSchedulePollById(_schedulePollId, _currentBandMemberId, tx) {
      options?.onCall?.('findSchedulePollById', tx);
      return options?.poll !== undefined ? options.poll : DEFAULT_POLL;
    },
    async countSchedulePollOptionsByIds(_schedulePollId, optionIds, tx) {
      options?.onCall?.('countSchedulePollOptionsByIds', tx);
      return options?.matchingOptionCount ?? optionIds.length;
    },
    async replaceSchedulePollVotes(_schedulePollId, _bandMemberId, optionIds, tx) {
      options?.onCall?.('replaceSchedulePollVotes', tx);
      options?.onReplaceVotes?.(optionIds);
    },
  };
}

describe('SchedulePollsService', () => {
  describe('createSchedulePoll', () => {
    it('활성 합주 공간 멤버가 일정 조율 투표를 생성한다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());

      const result = await service.createSchedulePoll(USER_ID, BAND_SPACE_ID, DEFAULT_INPUT);

      expect(result.schedulePollId).toBe(SCHEDULE_POLL_ID);
      expect(result.voterCount).toBe(2);
      expect(result.options[0].isRecommended).toBe(true);
      expect(result.options[1].isRecommended).toBe(false);
    });

    it('합주 공간이 없으면 NotFoundException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ bandSpace: null }), createPrismaServiceStub());

      await expect(service.createSchedulePoll(USER_ID, BAND_SPACE_ID, DEFAULT_INPUT)).rejects.toThrow(NotFoundException);
    });

    it('활성 합주 공간 멤버가 아니면 ForbiddenException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub({ member: null }), createPrismaServiceStub());

      await expect(service.createSchedulePoll(USER_ID, BAND_SPACE_ID, DEFAULT_INPUT)).rejects.toThrow(ForbiddenException);
    });

    it('후보 종료 시간이 시작 시간보다 늦지 않으면 BadRequestException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());
      const input = { options: [{ startAt: '2026-09-13T14:00:00.000Z', endAt: '2026-09-13T12:00:00.000Z' }] };

      await expect(service.createSchedulePoll(USER_ID, BAND_SPACE_ID, input)).rejects.toThrow(BadRequestException);
    });

    it('같은 후보 시간이 중복되면 BadRequestException을 던진다', async () => {
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceStub());
      const input = { options: [DEFAULT_INPUT.options[0], DEFAULT_INPUT.options[0]] };

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

    it('활성 합주 공간 멤버가 아니면 ForbiddenException을 던진다', async () => {
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

    it('활성 합주 공간 멤버가 아니면 ForbiddenException을 던진다', async () => {
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

      expect(capturedTransactions).toHaveLength(5);
      capturedTransactions.forEach(tx => expect(tx).toBe(capturedTransactions[0]));
    });

    it('외부 transaction client가 있으면 새 transaction을 열지 않는다', async () => {
      const externalTx = { transactionClient: true };
      const service = new SchedulePollsService(createSchedulePollsRepositoryStub(), createPrismaServiceFailingTransactionStub());

      await expect(
        service.updateMySchedulePollVote(USER_ID, SCHEDULE_POLL_ID, { schedulePollOptionIds: [OPTION_ID_1] }, externalTx as never),
      ).resolves.toBeDefined();
    });
  });
});

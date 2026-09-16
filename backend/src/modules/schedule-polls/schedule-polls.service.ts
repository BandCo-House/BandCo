import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import { BandMemberRole, type Prisma } from '../../generated/prisma';

import type { CreateSchedulePollInput } from './dto/create-schedule-poll.dto';
import type { UpdateSchedulePollVoteInput } from './dto/update-schedule-poll-vote.dto';
import { SCHEDULE_POLLS_REPOSITORY, type SchedulePollsRepository } from './repositories/schedule-polls.repository';
import type { DeleteSchedulePollResult, GetSchedulePollsResult, SchedulePollData, SchedulePollResult } from './types/schedule-poll.type';

const BAND_SPACE_NOT_FOUND_MESSAGE = '요청한 합주 공간을 찾을 수 없습니다.';
const SCHEDULE_POLL_NOT_FOUND_MESSAGE = '요청한 일정 투표를 찾을 수 없습니다.';
const NOT_BAND_SPACE_MEMBER_MESSAGE = '해당 합주 공간의 멤버가 아닙니다.';

@Injectable()
export class SchedulePollsService {
  constructor(
    @Inject(SCHEDULE_POLLS_REPOSITORY)
    private readonly schedulePollsRepository: SchedulePollsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 합주 공간이 속한 밴드 멤버의 일정 조율 투표 생성을 처리한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandSpaceId - 투표를 생성할 합주 공간 ID
   * @param {CreateSchedulePollInput} input - 후보 시간 목록
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SchedulePollResult>} 생성된 일정 조율 투표
   */
  async createSchedulePoll(
    userId: string,
    bandSpaceId: string,
    input: CreateSchedulePollInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SchedulePollResult> {
    const run = async (client: Prisma.TransactionClient): Promise<SchedulePollResult> => {
      const bandSpace = await this.schedulePollsRepository.findActiveBandSpaceById(bandSpaceId, client);

      if (bandSpace === null) {
        throw new NotFoundException(BAND_SPACE_NOT_FOUND_MESSAGE);
      }

      const member = await this.schedulePollsRepository.findBandMemberByBandSpaceIdAndUserId(bandSpaceId, userId, client);

      if (member === null) {
        throw new ForbiddenException(NOT_BAND_SPACE_MEMBER_MESSAGE);
      }

      this.validateSchedulePollOptions(input);

      const poll = await this.schedulePollsRepository.createSchedulePoll(bandSpaceId, member.id, input, client);
      return this.buildSchedulePollResult(poll);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 합주 공간의 일정 조율 투표 목록을 최신 생성순으로 제공한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandSpaceId - 조회할 합주 공간 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetSchedulePollsResult>} 일정 조율 투표 목록
   */
  async getSchedulePolls(userId: string, bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<GetSchedulePollsResult> {
    const bandSpace = await this.schedulePollsRepository.findActiveBandSpaceById(bandSpaceId, tx);

    if (bandSpace === null) {
      throw new NotFoundException(BAND_SPACE_NOT_FOUND_MESSAGE);
    }

    const member = await this.schedulePollsRepository.findBandMemberByBandSpaceIdAndUserId(bandSpaceId, userId, tx);

    if (member === null) {
      throw new ForbiddenException(NOT_BAND_SPACE_MEMBER_MESSAGE);
    }

    const items = await this.schedulePollsRepository.findSchedulePollsByBandSpaceId(bandSpaceId, member.id, tx);
    return { items };
  }

  /**
   * 합주 공간이 속한 밴드 멤버에게 후보별 투표자와 추천 후보를 제공한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} schedulePollId - 조회할 일정 조율 투표 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SchedulePollResult>} 일정 조율 투표 상세
   */
  async getSchedulePoll(userId: string, schedulePollId: string, tx?: Prisma.TransactionClient): Promise<SchedulePollResult> {
    const context = await this.schedulePollsRepository.findSchedulePollContextById(schedulePollId, tx);

    if (context === null) {
      throw new NotFoundException(SCHEDULE_POLL_NOT_FOUND_MESSAGE);
    }

    const member = await this.schedulePollsRepository.findBandMemberByBandSpaceIdAndUserId(context.bandSpaceId, userId, tx);

    if (member === null) {
      throw new ForbiddenException(NOT_BAND_SPACE_MEMBER_MESSAGE);
    }

    const poll = await this.schedulePollsRepository.findSchedulePollById(schedulePollId, member.id, tx);

    if (poll === null) {
      throw new NotFoundException(SCHEDULE_POLL_NOT_FOUND_MESSAGE);
    }

    return this.buildSchedulePollResult(poll);
  }

  /**
   * 밴드 멤버의 후보 선택을 전량 교체한다.
   *
   * 삭제 후 삽입 구조라 같은 멤버의 요청이 겹치면 unique 제약에 걸리므로, 멤버 행을 잠가 순차 실행한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} schedulePollId - 투표할 일정 조율 투표 ID
   * @param {UpdateSchedulePollVoteInput} input - 새 후보 선택 목록
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SchedulePollResult>} 투표 반영 후 일정 조율 투표 상세
   */
  async updateMySchedulePollVote(
    userId: string,
    schedulePollId: string,
    input: UpdateSchedulePollVoteInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SchedulePollResult> {
    const run = async (client: Prisma.TransactionClient): Promise<SchedulePollResult> => {
      const context = await this.schedulePollsRepository.findSchedulePollContextById(schedulePollId, client);

      if (context === null) {
        throw new NotFoundException(SCHEDULE_POLL_NOT_FOUND_MESSAGE);
      }

      const member = await this.schedulePollsRepository.findBandMemberByBandSpaceIdAndUserId(context.bandSpaceId, userId, client);

      if (member === null) {
        throw new ForbiddenException(NOT_BAND_SPACE_MEMBER_MESSAGE);
      }

      const uniqueOptionIds = new Set(input.schedulePollOptionIds);

      if (uniqueOptionIds.size !== input.schedulePollOptionIds.length) {
        throw new BadRequestException('중복된 후보 시간을 선택할 수 없습니다.');
      }

      const optionIds = [...uniqueOptionIds];
      const matchingOptionCount = await this.schedulePollsRepository.countSchedulePollOptionsByIds(schedulePollId, optionIds, client);

      if (matchingOptionCount !== optionIds.length) {
        throw new BadRequestException('해당 일정 투표에 속하지 않은 후보 시간이 포함되어 있습니다.');
      }

      await this.schedulePollsRepository.lockBandMemberForVote(member.id, client);
      await this.schedulePollsRepository.replaceSchedulePollVotes(schedulePollId, member.id, optionIds, client);

      const poll = await this.schedulePollsRepository.findSchedulePollById(schedulePollId, member.id, client);

      if (poll === null) {
        throw new NotFoundException(SCHEDULE_POLL_NOT_FOUND_MESSAGE);
      }

      return this.buildSchedulePollResult(poll);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 투표 생성자 또는 밴드 리더·부리더의 일정 조율 투표 삭제를 처리한다.
   *
   * 생성자가 밴드를 떠나면 생성자 ID가 비므로, 남은 투표를 정리할 수 있도록 리더·부리더에게도 삭제를 허용한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} schedulePollId - 삭제할 일정 조율 투표 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeleteSchedulePollResult>} 삭제된 일정 조율 투표 ID
   */
  async deleteSchedulePoll(userId: string, schedulePollId: string, tx?: Prisma.TransactionClient): Promise<DeleteSchedulePollResult> {
    const run = async (client: Prisma.TransactionClient): Promise<DeleteSchedulePollResult> => {
      const context = await this.schedulePollsRepository.findSchedulePollContextById(schedulePollId, client);

      if (context === null) {
        throw new NotFoundException(SCHEDULE_POLL_NOT_FOUND_MESSAGE);
      }

      const member = await this.schedulePollsRepository.findBandMemberByBandSpaceIdAndUserId(context.bandSpaceId, userId, client);

      if (member === null) {
        throw new ForbiddenException(NOT_BAND_SPACE_MEMBER_MESSAGE);
      }

      const isCreator = context.createdByBandMemberId === member.id;
      const isBandManager = member.role === BandMemberRole.BM || member.role === BandMemberRole.ADMIN;

      if (!isCreator && !isBandManager) {
        throw new ForbiddenException('투표 생성자 또는 밴드 리더·부리더만 일정 투표를 삭제할 수 있습니다.');
      }

      await this.schedulePollsRepository.deleteSchedulePoll(schedulePollId, client);
      return { schedulePollId };
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  private validateSchedulePollOptions(input: CreateSchedulePollInput): void {
    const optionKeys = new Set<string>();

    for (const option of input.options) {
      const startAt = new Date(option.startAt);
      const endAt = new Date(option.endAt);

      if (startAt >= endAt) {
        throw new BadRequestException('각 후보의 종료 시간은 시작 시간보다 이후여야 합니다.');
      }

      const optionKey = `${startAt.toISOString()}_${endAt.toISOString()}`;

      if (optionKeys.has(optionKey)) {
        throw new BadRequestException('동일한 후보 시간을 중복해서 등록할 수 없습니다.');
      }

      optionKeys.add(optionKey);
    }
  }

  private buildSchedulePollResult(poll: SchedulePollData): SchedulePollResult {
    const voteCounts = poll.options.map(option => option.voters.length);
    const highestVoteCount = voteCounts.length > 0 ? Math.max(...voteCounts) : 0;
    const voterIds = new Set(poll.options.flatMap(option => option.voters.map(voter => voter.bandMemberId)));

    return {
      ...poll,
      voterCount: voterIds.size,
      options: poll.options.map(option => ({
        ...option,
        voteCount: option.voters.length,
        isRecommended: highestVoteCount > 0 && option.voters.length === highestVoteCount,
      })),
    };
  }
}

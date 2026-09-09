import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';

import type { CreateSchedulePollInput } from './dto/create-schedule-poll.dto';
import type { UpdateSchedulePollVoteInput } from './dto/update-schedule-poll-vote.dto';
import { SCHEDULE_POLLS_REPOSITORY, type SchedulePollsRepository } from './repositories/schedule-polls.repository';
import type { SchedulePollData, SchedulePollResult } from './types/schedule-poll.type';

@Injectable()
export class SchedulePollsService {
  constructor(
    @Inject(SCHEDULE_POLLS_REPOSITORY)
    private readonly schedulePollsRepository: SchedulePollsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 활성 합주 공간 멤버의 일정 조율 투표 생성을 처리한다.
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
        throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');
      }

      const member = await this.schedulePollsRepository.findActiveSpaceMemberByUserId(bandSpaceId, userId, client);

      if (member === null) {
        throw new ForbiddenException('활성 합주 공간 멤버만 일정 투표를 생성할 수 있습니다.');
      }

      this.validateSchedulePollOptions(input);

      const poll = await this.schedulePollsRepository.createSchedulePoll(bandSpaceId, member.bandMemberId, input, client);
      return this.buildSchedulePollResult(poll);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 활성 합주 공간 멤버에게 후보별 투표자와 추천 후보를 제공한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} schedulePollId - 조회할 일정 조율 투표 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SchedulePollResult>} 일정 조율 투표 상세
   */
  async getSchedulePoll(userId: string, schedulePollId: string, tx?: Prisma.TransactionClient): Promise<SchedulePollResult> {
    const context = await this.schedulePollsRepository.findSchedulePollContextById(schedulePollId, tx);

    if (context === null) {
      throw new NotFoundException('요청한 일정 투표를 찾을 수 없습니다.');
    }

    const member = await this.schedulePollsRepository.findActiveSpaceMemberByUserId(context.bandSpaceId, userId, tx);

    if (member === null) {
      throw new ForbiddenException('활성 합주 공간 멤버만 일정 투표를 조회할 수 있습니다.');
    }

    const poll = await this.schedulePollsRepository.findSchedulePollById(schedulePollId, member.bandMemberId, tx);

    if (poll === null) {
      throw new NotFoundException('요청한 일정 투표를 찾을 수 없습니다.');
    }

    return this.buildSchedulePollResult(poll);
  }

  /**
   * 활성 합주 공간 멤버의 후보 선택을 전량 교체한다.
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
        throw new NotFoundException('요청한 일정 투표를 찾을 수 없습니다.');
      }

      const member = await this.schedulePollsRepository.findActiveSpaceMemberByUserId(context.bandSpaceId, userId, client);

      if (member === null) {
        throw new ForbiddenException('활성 합주 공간 멤버만 일정 투표에 참여할 수 있습니다.');
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

      await this.schedulePollsRepository.replaceSchedulePollVotes(schedulePollId, member.bandMemberId, optionIds, client);

      const poll = await this.schedulePollsRepository.findSchedulePollById(schedulePollId, member.bandMemberId, client);

      if (poll === null) {
        throw new NotFoundException('요청한 일정 투표를 찾을 수 없습니다.');
      }

      return this.buildSchedulePollResult(poll);
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

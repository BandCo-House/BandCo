import type { BandMemberRole, Prisma } from '../../../generated/prisma';
import type { CreateSchedulePollInput } from '../dto/create-schedule-poll.dto';
import type { SchedulePollData, SchedulePollListItem } from '../types/schedule-poll.type';

export const SCHEDULE_POLLS_REPOSITORY = Symbol('SCHEDULE_POLLS_REPOSITORY');

export interface SchedulePollsRepository {
  /** 삭제되지 않은 합주 공간의 존재 여부를 확인한다. */
  findActiveBandSpaceById(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /** 사용자가 합주 공간이 속한 밴드의 멤버인지 확인하고 밴드 멤버 ID와 역할을 반환한다. */
  findBandMemberByBandSpaceIdAndUserId(
    bandSpaceId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; role: BandMemberRole } | null>;

  /** 같은 멤버의 투표 교체 요청이 동시에 실행되지 않도록 밴드 멤버 행을 잠근다. */
  lockBandMemberForVote(bandMemberId: string, tx: Prisma.TransactionClient): Promise<void>;

  /** 후보 시간을 포함한 일정 조율 투표를 생성한다. */
  createSchedulePoll(
    bandSpaceId: string,
    createdByBandMemberId: string,
    input: CreateSchedulePollInput,
    tx?: Prisma.TransactionClient,
  ): Promise<SchedulePollData>;

  /** 권한·마감 검사에 사용할 투표의 합주 공간 ID·생성자·마감 일시를 조회한다. */
  findSchedulePollContextById(
    schedulePollId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ bandSpaceId: string; createdByBandMemberId: string | null; closesAt: Date } | null>;

  /** 후보별 투표자와 현재 멤버의 선택을 포함한 투표 상세를 조회한다. */
  findSchedulePollById(schedulePollId: string, currentBandMemberId: string, tx?: Prisma.TransactionClient): Promise<SchedulePollData | null>;

  /** 합주 공간의 투표 목록을 최신 생성순으로 조회한다. */
  findSchedulePollsByBandSpaceId(bandSpaceId: string, currentBandMemberId: string, tx?: Prisma.TransactionClient): Promise<SchedulePollListItem[]>;

  /** 전달된 후보 ID 중 해당 투표에 속한 후보의 수를 반환한다. */
  countSchedulePollOptionsByIds(schedulePollId: string, optionIds: string[], tx?: Prisma.TransactionClient): Promise<number>;

  /** 멤버의 기존 선택을 지우고 요청된 후보 선택으로 교체한다. */
  replaceSchedulePollVotes(schedulePollId: string, bandMemberId: string, optionIds: string[], tx?: Prisma.TransactionClient): Promise<void>;

  /** 투표를 삭제한다. 후보와 선택은 cascade로 함께 삭제된다. */
  deleteSchedulePoll(schedulePollId: string, tx?: Prisma.TransactionClient): Promise<void>;
}

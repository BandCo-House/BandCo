import type { Prisma } from '../../../generated/prisma';
import type { CreateScheduleInput } from '../dto/create-schedule.dto';
import type { CreateScheduleResult } from '../types/create-schedule-result.type';

export const SCHEDULES_REPOSITORY = Symbol('SCHEDULES_REPOSITORY');

export interface SchedulesRepository {
  /**
   * 밴드 공간에 일정을 생성한다.
   * songIds, participantBandMemberIds가 있으면 각 중간 테이블에도 레코드를 삽입한다.
   */
  createSchedule(
    bandSpaceId: string,
    createdByBandMemberId: string,
    input: CreateScheduleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateScheduleResult>;

  /** 밴드 공간 존재 여부를 확인한다 (deletedAt: null 조건 포함). */
  findBandSpaceById(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /** 합주 공간 멤버의 userId 목록을 반환한다. 알림 수신자 조회에 사용한다. */
  findSpaceMemberUserIds(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<string[]>;
}

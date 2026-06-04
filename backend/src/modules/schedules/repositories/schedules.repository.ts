import type { Prisma } from '../../../generated/prisma';
import type { CreateScheduleInput } from '../dto/create-schedule.dto';
import type { GetSchedulesQuery } from '../dto/get-schedules-query.dto';
import type { UpdateScheduleInput } from '../dto/update-schedule.dto';
import type { CreateScheduleResult } from '../types/create-schedule-result.type';
import type { GetScheduleDetailResult } from '../types/schedule-detail.type';
import type { GetSpaceSchedulesResult } from '../types/schedule-list-item.type';
import type { UpdateScheduleResult } from '../types/update-schedule-result.type';

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

  /**
   * 일정을 수정한다.
   * songIds가 있으면 ScheduleSong을 전량 교체(deleteMany → createMany)한다.
   * participantBandMemberIds가 있으면 ScheduleParticipant를 전량 교체한다.
   */
  updateSchedule(scheduleId: string, input: UpdateScheduleInput, tx?: Prisma.TransactionClient): Promise<UpdateScheduleResult>;

  /** 일정 상세 정보를 조회한다. */
  findScheduleById(scheduleId: string, tx?: Prisma.TransactionClient): Promise<GetScheduleDetailResult | undefined>;

  /** 일정을 hard delete한다. */
  deleteSchedule(scheduleId: string, tx?: Prisma.TransactionClient): Promise<void>;

  /** 밴드 공간 기준 일정 목록을 cursor pagination으로 조회한다. */
  findSchedulesBySpaceId(bandSpaceId: string, query: GetSchedulesQuery, tx?: Prisma.TransactionClient): Promise<GetSpaceSchedulesResult>;

  /** 밴드 공간 존재 여부를 확인한다 (deletedAt: null 조건 포함). */
  findBandSpaceById(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /** 합주 공간 멤버의 userId 목록을 반환한다. 알림 수신자 조회에 사용한다. */
  findSpaceMemberUserIds(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<string[]>;
}

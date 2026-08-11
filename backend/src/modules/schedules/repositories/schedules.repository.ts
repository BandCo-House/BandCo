import type { Prisma } from '../../../generated/prisma';
import type { CreateScheduleInput } from '../dto/create-schedule.dto';
import type { GetSchedulesQuery } from '../dto/get-schedules-query.dto';
import type { UpdateScheduleInput } from '../dto/update-schedule.dto';
import type { GetBandSchedulesResult } from '../types/band-schedule-list-item.type';
import type { CreateScheduleResult } from '../types/create-schedule-result.type';
import type { GetScheduleDetailResult } from '../types/schedule-detail.type';
import type { GetSpaceSchedulesResult } from '../types/schedule-list-item.type';
import type { UpdateScheduleResult } from '../types/update-schedule-result.type';

export const SCHEDULES_REPOSITORY = Symbol('SCHEDULES_REPOSITORY');

export interface SchedulesRepository {
  /**
   * 밴드 공간에 일정을 생성한다.
   * songIds, participantBandMemberIds, referenceFiles가 있으면 연관 레코드도 삽입한다.
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
   * participantBandMemberIds와 referenceFiles가 있으면 각 연관 레코드를 전량 교체한다.
   */
  updateSchedule(scheduleId: string, input: UpdateScheduleInput, tx?: Prisma.TransactionClient): Promise<UpdateScheduleResult>;

  /**
   * 일정 상세 정보를 조회한다.
   * userId가 주어지면 해당 사용자가 생성자이거나 참여자인지로 isMine을 계산한다.
   */
  findScheduleById(scheduleId: string, userId?: string, tx?: Prisma.TransactionClient): Promise<GetScheduleDetailResult | undefined>;

  /** 일정을 hard delete한다. */
  deleteSchedule(scheduleId: string, tx?: Prisma.TransactionClient): Promise<void>;

  /** 밴드 공간 기준 일정 목록을 cursor pagination으로 조회한다. 로그인 사용자 기준 isMine을 함께 계산한다. */
  findSchedulesBySpaceId(
    bandSpaceId: string,
    query: GetSchedulesQuery,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<GetSpaceSchedulesResult>;

  /** 밴드 공간 존재 여부를 확인한다 (deletedAt: null 조건 포함). */
  findBandSpaceById(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /** 합주 공간 멤버의 userId 목록을 반환한다. 알림 수신자 조회에 사용한다. */
  findSpaceMemberUserIds(bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<string[]>;

  /** 밴드 기준 전체 공간의 일정 목록을 cursor pagination으로 조회한다. 로그인 사용자 기준 isMine을 함께 계산한다. */
  findSchedulesByBandId(bandId: string, query: GetSchedulesQuery, userId: string, tx?: Prisma.TransactionClient): Promise<GetBandSchedulesResult>;

  /** 밴드 존재 여부를 확인한다 (deletedAt: null 조건 포함). */
  findBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /** 밴드 공간 기준으로 특정 사용자의 밴드 멤버 정보를 조회한다. 공간 멤버 여부 검증에 사용한다. */
  findBandMemberByBandSpaceIdAndUserId(bandSpaceId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /** 팀이 해당 공간과 같은 밴드 소속인지 확인한다. 일정 생성 시 teamId 검증에 사용한다. */
  findTeamInSameBandAsSpace(teamId: string, bandSpaceId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;
}

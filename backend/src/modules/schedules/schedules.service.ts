import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
import { NotificationType, ScheduleType } from '../../generated/prisma';
import { NotificationsService } from '../notifications/notifications.service';

import type { CreateScheduleInput } from './dto/create-schedule.dto';
import type { GetSchedulesQuery } from './dto/get-schedules-query.dto';
import type { ScheduleParticipantInput } from './dto/schedule-participant.dto';
import type { UpdateScheduleInput } from './dto/update-schedule.dto';
import { SCHEDULES_REPOSITORY, type SchedulesRepository } from './repositories/schedules.repository';
import type { GetBandSchedulesResult } from './types/band-schedule-list-item.type';
import type { CreateScheduleResult } from './types/create-schedule-result.type';
import type { DeleteScheduleResult } from './types/delete-schedule-result.type';
import type { GetScheduleDetailResult } from './types/schedule-detail.type';
import type { GetSpaceSchedulesResult } from './types/schedule-list-item.type';
import type { UpdateScheduleResult } from './types/update-schedule-result.type';

@Injectable()
export class SchedulesService {
  constructor(
    @Inject(SCHEDULES_REPOSITORY) private readonly schedulesRepository: SchedulesRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 참여자 입력을 한 가지 모양으로 정리한다.
   *
   * 신규 `participants`(세션 포함)와 구형 `participantBandMemberIds`를 함께 받는다.
   * 백엔드가 프론트보다 먼저 배포되므로 운영 중인 구형 클라이언트가 계속 동작해야 한다.
   * 둘 다 오면 표현력이 큰 `participants`를 택한다.
   *
   * `@IsOptional()`은 undefined뿐 아니라 null도 검증에서 빼주므로 null이 그대로 들어온다.
   * null은 "안 보냄"으로 본다 — 참여자를 비우는 건 빈 배열이 맡는다.
   *
   * @param {ScheduleParticipantInput[] | null | undefined} participants - 신규 형식 참여자 목록
   * @param {string[] | null | undefined} participantBandMemberIds - 구형 형식 참여자 ID 목록
   * @returns {ScheduleParticipantInput[] | undefined} 정규화된 목록. 둘 다 없으면 undefined(수정에서 "건드리지 않음")
   */
  private normalizeParticipants(
    participants: ScheduleParticipantInput[] | null | undefined,
    participantBandMemberIds: string[] | null | undefined,
  ): ScheduleParticipantInput[] | undefined {
    if (participants != null) return participants;
    if (participantBandMemberIds != null) return participantBandMemberIds.map(bandMemberId => ({ bandMemberId }));
    return undefined;
  }

  /**
   * 세션 배정이 유효한지 확인한다.
   *
   * @param {ScheduleParticipantInput[] | undefined} participants - 정규화된 참여자 목록
   * @param {ScheduleType} scheduleType - 저장될 최종 일정 유형
   * @param {Prisma.TransactionClient} client - 상위 트랜잭션 client
   * @throws {BadRequestException} 회의에 세션을 배정했거나 존재하지 않는 세션을 지정한 경우
   */
  private async validateParticipantSessions(
    participants: ScheduleParticipantInput[] | undefined,
    scheduleType: ScheduleType,
    client: Prisma.TransactionClient,
  ): Promise<void> {
    if (participants === undefined) return;

    const skillTypeIds = [...new Set(participants.map(participant => participant.skillTypeId).filter((id): id is string => id !== undefined))];
    if (skillTypeIds.length === 0) return;

    if (scheduleType === ScheduleType.MEETING) {
      throw new BadRequestException('회의 일정에는 세션을 배정할 수 없습니다.');
    }

    const existingIds = await this.schedulesRepository.findExistingSkillTypeIds(skillTypeIds, client);
    if (existingIds.length !== skillTypeIds.length) {
      throw new BadRequestException('존재하지 않는 세션이 포함되어 있습니다.');
    }
  }

  /** 밴드 공간에 일정을 생성한다. 공간 존재 및 멤버 여부를 확인한 후 시간 범위를 검증한다. */
  async createSchedule(
    bandSpaceId: string,
    userId: string,
    input: CreateScheduleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateScheduleResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateScheduleResult> => {
      const space = await this.schedulesRepository.findBandSpaceById(bandSpaceId, client);
      if (!space) throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');

      const bandMember = await this.schedulesRepository.findBandMemberByBandSpaceIdAndUserId(bandSpaceId, userId, client);
      if (!bandMember) throw new ForbiddenException('해당 합주 공간의 멤버가 아닙니다.');

      if (input.startAt && input.endAt && new Date(input.startAt) >= new Date(input.endAt)) {
        throw new BadRequestException('종료 시간은 시작 시간보다 이후여야 합니다.');
      }

      if (input.teamId) {
        const team = await this.schedulesRepository.findTeamInSameBandAsSpace(input.teamId, bandSpaceId, client);
        if (!team) throw new BadRequestException('해당 밴드에 속한 팀이 아닙니다.');
      }

      const participants = this.normalizeParticipants(input.participants, input.participantBandMemberIds);
      await this.validateParticipantSessions(participants, input.scheduleType, client);

      return this.schedulesRepository.createSchedule(bandSpaceId, bandMember.id, { ...input, participants: participants ?? [] }, client);
    };

    const result = await (tx ? run(tx) : this.prisma.$transaction(run));

    try {
      const memberUserIds = await this.schedulesRepository.findSpaceMemberUserIds(bandSpaceId);
      if (memberUserIds.length > 0) {
        await this.notificationsService.createManyNotifications(
          memberUserIds.map(userId => ({
            userId,
            type: NotificationType.NOTICE,
            title: '새 합주 일정이 생성되었습니다',
            description: result.title,
            targetPath: `/schedules/${result.scheduleId}`,
          })),
        );
      }
    } catch {
      /* 알림 실패는 비즈니스 로직에 영향을 주지 않는다 */
    }

    return result;
  }

  /** 일정을 수정한다. 기존 값과 합산하여 시간 범위를 검증한다. */
  async updateSchedule(scheduleId: string, input: UpdateScheduleInput, tx?: Prisma.TransactionClient): Promise<UpdateScheduleResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdateScheduleResult> => {
      const existing = await this.schedulesRepository.findScheduleById(scheduleId, undefined, client);
      if (!existing) throw new NotFoundException('요청한 일정을 찾을 수 없습니다.');

      const startAt = input.startAt ? new Date(input.startAt) : existing.schedule.startAt ? new Date(existing.schedule.startAt) : null;
      const endAt = input.endAt ? new Date(input.endAt) : existing.schedule.endAt ? new Date(existing.schedule.endAt) : null;

      if (startAt && endAt && startAt >= endAt) {
        throw new BadRequestException('종료 시간은 시작 시간보다 이후여야 합니다.');
      }

      const participants = this.normalizeParticipants(input.participants, input.participantBandMemberIds);
      // 합주를 회의로 바꾸면서 세션을 함께 보내면 저장 뒤 무효한 편성이 남는다.
      // 검증 기준은 요청값이 아니라 저장될 최종 유형이다.
      const scheduleType = (input.scheduleType ?? existing.schedule.scheduleType) as ScheduleType;
      await this.validateParticipantSessions(participants, scheduleType, client);

      return this.schedulesRepository.updateSchedule(scheduleId, { ...input, participants }, client);
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /** 일정을 삭제한다. hard delete이며 deletedAt은 서비스 레이어에서 생성한다. */
  async deleteSchedule(scheduleId: string, tx?: Prisma.TransactionClient): Promise<DeleteScheduleResult> {
    const existing = await this.schedulesRepository.findScheduleById(scheduleId, undefined, tx);
    if (!existing) throw new NotFoundException('요청한 일정을 찾을 수 없습니다.');

    const { spaceId, title } = existing.schedule;

    await this.schedulesRepository.deleteSchedule(scheduleId, tx);

    try {
      const memberUserIds = await this.schedulesRepository.findSpaceMemberUserIds(spaceId);
      if (memberUserIds.length > 0) {
        await this.notificationsService.createManyNotifications(
          memberUserIds.map(userId => ({
            userId,
            type: NotificationType.NOTICE,
            title: '합주 일정이 삭제되었습니다',
            description: title,
          })),
        );
      }
    } catch {
      /* 알림 실패는 비즈니스 로직에 영향을 주지 않는다 */
    }

    return { scheduleId, deletedAt: new Date().toISOString() };
  }

  /** 밴드 공간 기준 일정 목록을 cursor pagination으로 조회한다. */
  async getSpaceSchedules(
    bandSpaceId: string,
    userId: string,
    query: GetSchedulesQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetSpaceSchedulesResult> {
    const space = await this.schedulesRepository.findBandSpaceById(bandSpaceId, tx);
    if (!space) throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');

    return this.schedulesRepository.findSchedulesBySpaceId(bandSpaceId, query, userId, tx);
  }

  /** 일정 상세 정보를 조회한다. */
  async getScheduleDetail(scheduleId: string, userId: string, tx?: Prisma.TransactionClient): Promise<GetScheduleDetailResult> {
    const result = await this.schedulesRepository.findScheduleById(scheduleId, userId, tx);
    if (!result) throw new NotFoundException('요청한 일정을 찾을 수 없습니다.');

    return result;
  }

  /** 밴드에 속한 전체 공간의 일정 목록을 조회한다. */
  async getBandSchedules(bandId: string, userId: string, query: GetSchedulesQuery, tx?: Prisma.TransactionClient): Promise<GetBandSchedulesResult> {
    const band = await this.schedulesRepository.findBandById(bandId, tx);
    if (!band) throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');

    return this.schedulesRepository.findSchedulesByBandId(bandId, query, userId, tx);
  }
}

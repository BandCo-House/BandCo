import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
import { NotificationType } from '../../generated/prisma';
import { NotificationsService } from '../notifications/notifications.service';

import type { CreateScheduleInput } from './dto/create-schedule.dto';
import type { GetSchedulesQuery } from './dto/get-schedules-query.dto';
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

      return this.schedulesRepository.createSchedule(bandSpaceId, bandMember.id, input, client);
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

      return this.schedulesRepository.updateSchedule(scheduleId, input, client);
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

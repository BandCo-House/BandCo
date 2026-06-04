import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
import { NotificationType } from '../../generated/prisma';
import { NotificationsService } from '../notifications/notifications.service';

import type { CreateScheduleInput } from './dto/create-schedule.dto';
import type { UpdateScheduleInput } from './dto/update-schedule.dto';
import { SCHEDULES_REPOSITORY, type SchedulesRepository } from './repositories/schedules.repository';
import type { CreateScheduleResult } from './types/create-schedule-result.type';
import type { DeleteScheduleResult } from './types/delete-schedule-result.type';
import type { UpdateScheduleResult } from './types/update-schedule-result.type';
import { DEMO_BAND_MEMBER_ID } from './schedules.constants';

@Injectable()
export class SchedulesService {
  constructor(
    @Inject(SCHEDULES_REPOSITORY) private readonly schedulesRepository: SchedulesRepository,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** 밴드 공간에 일정을 생성한다. 공간 존재 확인 후 시간 범위를 검증한다. */
  async createSchedule(bandSpaceId: string, input: CreateScheduleInput, tx?: Prisma.TransactionClient): Promise<CreateScheduleResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateScheduleResult> => {
      const space = await this.schedulesRepository.findBandSpaceById(bandSpaceId, client);
      if (!space) throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');

      if (input.startAt && input.endAt && new Date(input.startAt) >= new Date(input.endAt)) {
        throw new BadRequestException('종료 시간은 시작 시간보다 이후여야 합니다.');
      }

      return this.schedulesRepository.createSchedule(bandSpaceId, DEMO_BAND_MEMBER_ID, input, client);
    };

    const result = await (tx ? run(tx) : this.prisma.$transaction(run));

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

    return result;
  }

  /** 일정을 수정한다. 기존 값과 합산하여 시간 범위를 검증한다. */
  async updateSchedule(scheduleId: string, input: UpdateScheduleInput, tx?: Prisma.TransactionClient): Promise<UpdateScheduleResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdateScheduleResult> => {
      const existing = await this.schedulesRepository.findScheduleById(scheduleId, client);
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
    const existing = await this.schedulesRepository.findScheduleById(scheduleId, tx);
    if (!existing) throw new NotFoundException('요청한 일정을 찾을 수 없습니다.');

    const { spaceId, title } = existing.schedule;

    await this.schedulesRepository.deleteSchedule(scheduleId, tx);

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

    return { scheduleId, deletedAt: new Date().toISOString() };
  }
}

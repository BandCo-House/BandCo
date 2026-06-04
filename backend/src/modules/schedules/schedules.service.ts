import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
import { NotificationType } from '../../generated/prisma';
import { NotificationsService } from '../notifications/notifications.service';

import type { CreateScheduleInput } from './dto/create-schedule.dto';
import { SCHEDULES_REPOSITORY, type SchedulesRepository } from './repositories/schedules.repository';
import type { CreateScheduleResult } from './types/create-schedule-result.type';
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
}

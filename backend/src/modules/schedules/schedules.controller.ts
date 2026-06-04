import { Body, Controller, Param, Patch, Post } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { CreateScheduleBodyDto } from './dto/create-schedule.dto';
import { UpdateScheduleBodyDto } from './dto/update-schedule.dto';
import type { CreateScheduleResult } from './types/create-schedule-result.type';
import type { UpdateScheduleResult } from './types/update-schedule-result.type';
import { SchedulesService } from './schedules.service';

@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('bandspaces/:bandspaceId/schedules')
  async createSchedule(
    @Param('bandspaceId') bandspaceId: string,
    @Body() input: CreateScheduleBodyDto,
  ): Promise<ApiSuccessResponse<CreateScheduleResult>> {
    const result = await this.schedulesService.createSchedule(bandspaceId, input);
    return createSuccessResponse('합주 일정 생성 성공', result);
  }

  @Patch('schedules/:scheduleId')
  async updateSchedule(
    @Param('scheduleId') scheduleId: string,
    @Body() input: UpdateScheduleBodyDto,
  ): Promise<ApiSuccessResponse<UpdateScheduleResult>> {
    const result = await this.schedulesService.updateSchedule(scheduleId, input);
    return createSuccessResponse('합주 일정 수정 성공', result);
  }
}

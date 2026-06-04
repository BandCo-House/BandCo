import { Body, Controller, Param, Post } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { CreateScheduleBodyDto } from './dto/create-schedule.dto';
import type { CreateScheduleResult } from './types/create-schedule-result.type';
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
}

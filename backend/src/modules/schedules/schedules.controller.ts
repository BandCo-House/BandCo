import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { CreateScheduleBodyDto } from './dto/create-schedule.dto';
import { GetSchedulesQueryDto } from './dto/get-schedules-query.dto';
import { UpdateScheduleBodyDto } from './dto/update-schedule.dto';
import type { GetBandSchedulesResult } from './types/band-schedule-list-item.type';
import type { CreateScheduleResult } from './types/create-schedule-result.type';
import type { DeleteScheduleResult } from './types/delete-schedule-result.type';
import type { GetScheduleDetailResult } from './types/schedule-detail.type';
import type { GetSpaceSchedulesResult } from './types/schedule-list-item.type';
import type { UpdateScheduleResult } from './types/update-schedule-result.type';
import { SchedulesService } from './schedules.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller()
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @UseGuards(AccessTokenGuard)
  @Post('bandspaces/:bandspaceId/schedules')
  async createSchedule(
    @Req() request: AuthenticatedRequest,
    @Param('bandspaceId') bandspaceId: string,
    @Body() input: CreateScheduleBodyDto,
  ): Promise<ApiSuccessResponse<CreateScheduleResult>> {
    const result = await this.schedulesService.createSchedule(bandspaceId, request.user.id, input);
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

  @Delete('schedules/:scheduleId')
  async deleteSchedule(@Param('scheduleId') scheduleId: string): Promise<ApiSuccessResponse<DeleteScheduleResult>> {
    const result = await this.schedulesService.deleteSchedule(scheduleId);
    return createSuccessResponse('합주 일정 삭제 성공', result);
  }

  @Get('bandspaces/:bandspaceId/schedules')
  async getSpaceSchedules(
    @Param('bandspaceId') bandspaceId: string,
    @Query() query: GetSchedulesQueryDto,
  ): Promise<ApiSuccessResponse<GetSpaceSchedulesResult>> {
    const result = await this.schedulesService.getSpaceSchedules(bandspaceId, query);
    return createSuccessResponse('합주 일정 목록 조회 성공', result);
  }

  @Get('schedules/:scheduleId')
  async getScheduleDetail(@Param('scheduleId') scheduleId: string): Promise<ApiSuccessResponse<GetScheduleDetailResult>> {
    const result = await this.schedulesService.getScheduleDetail(scheduleId);
    return createSuccessResponse('합주 일정 상세 조회 성공', result);
  }

  @Get('bands/:bandId/schedules')
  async getBandSchedules(@Param('bandId') bandId: string, @Query() query: GetSchedulesQueryDto): Promise<ApiSuccessResponse<GetBandSchedulesResult>> {
    const result = await this.schedulesService.getBandSchedules(bandId, query);
    return createSuccessResponse('밴드 일정 목록 조회 성공', result);
  }
}

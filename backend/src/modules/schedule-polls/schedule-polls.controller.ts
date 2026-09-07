import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { AuthUser } from '../users/repositoreis/user.repository';

import { CreateSchedulePollBodyDto } from './dto/create-schedule-poll.dto';
import { UpdateSchedulePollVoteBodyDto } from './dto/update-schedule-poll-vote.dto';
import type { SchedulePollResult } from './types/schedule-poll.type';
import { SchedulePollsService } from './schedule-polls.service';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('일정 조율 투표')
@ApiBearerAuth()
@UseGuards(AccessTokenGuard)
@Controller()
export class SchedulePollsController {
  constructor(private readonly schedulePollsService: SchedulePollsService) {}

  @Post('bandspaces/:bandSpaceId/schedule-polls')
  @ApiOperation({ summary: '일정 조율 투표 생성' })
  @ApiParam({ name: 'bandSpaceId', description: '합주 공간 ID' })
  @ApiResponse({ status: 201, description: '일정 조율 투표 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 후보 시간' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '합주 공간 멤버가 아님' })
  @ApiResponse({ status: 404, description: '합주 공간 없음' })
  async createSchedulePoll(
    @Req() request: AuthenticatedRequest,
    @Param('bandSpaceId', new ParseUUIDPipe()) bandSpaceId: string,
    @Body() input: CreateSchedulePollBodyDto,
  ): Promise<ApiSuccessResponse<SchedulePollResult>> {
    const result = await this.schedulePollsService.createSchedulePoll(request.user.id, bandSpaceId, input);
    return createSuccessResponse('일정 조율 투표 생성 성공', result);
  }

  @Get('schedule-polls/:schedulePollId')
  @ApiOperation({ summary: '일정 조율 투표 상세 조회' })
  @ApiParam({ name: 'schedulePollId', description: '일정 조율 투표 ID' })
  @ApiResponse({ status: 200, description: '일정 조율 투표 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '합주 공간 멤버가 아님' })
  @ApiResponse({ status: 404, description: '일정 조율 투표 없음' })
  async getSchedulePoll(
    @Req() request: AuthenticatedRequest,
    @Param('schedulePollId', new ParseUUIDPipe()) schedulePollId: string,
  ): Promise<ApiSuccessResponse<SchedulePollResult>> {
    const result = await this.schedulePollsService.getSchedulePoll(request.user.id, schedulePollId);
    return createSuccessResponse('일정 조율 투표 조회 성공', result);
  }

  @Put('schedule-polls/:schedulePollId/votes/me')
  @ApiOperation({ summary: '내 일정 조율 투표 등록 및 수정' })
  @ApiParam({ name: 'schedulePollId', description: '일정 조율 투표 ID' })
  @ApiResponse({ status: 200, description: '일정 조율 투표 반영 성공' })
  @ApiResponse({ status: 400, description: '잘못된 후보 선택' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '합주 공간 멤버가 아님' })
  @ApiResponse({ status: 404, description: '일정 조율 투표 없음' })
  async updateMySchedulePollVote(
    @Req() request: AuthenticatedRequest,
    @Param('schedulePollId', new ParseUUIDPipe()) schedulePollId: string,
    @Body() input: UpdateSchedulePollVoteBodyDto,
  ): Promise<ApiSuccessResponse<SchedulePollResult>> {
    const result = await this.schedulePollsService.updateMySchedulePollVote(request.user.id, schedulePollId, input);
    return createSuccessResponse('일정 조율 투표 반영 성공', result);
  }
}

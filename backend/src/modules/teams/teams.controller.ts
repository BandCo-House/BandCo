import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { AuthUser } from '../users/repositoreis/user.repository';

import { AddTeamMemberBodyDto } from './dto/add-team-member.dto';
import { ChangeTeamLeaderBodyDto } from './dto/change-team-leader.dto';
import { CreateTeamBodyDto } from './dto/create-team.dto';
import { GetBandTeamsQueryDto } from './dto/get-band-teams-query.dto';
import { GetMyTeamsQueryDto } from './dto/get-my-teams-query.dto';
import { GetTeamMembersQueryDto } from './dto/get-team-members-query.dto';
import { UpdateTeamBodyDto } from './dto/update-team.dto';
import type { AddTeamMemberResult } from './types/add-team-member-result.type';
import type { ChangeTeamLeaderResult } from './types/change-team-leader-result.type';
import type { CreateTeamResult } from './types/create-team-result.type';
import type { DeleteTeamResult } from './types/delete-team-result.type';
import type { GetBandTeamsResult } from './types/get-band-teams-result.type';
import type { GetMyTeamsResult } from './types/get-my-teams-result.type';
import type { GetTeamMembersResult } from './types/get-team-members-result.type';
import type { GetTeamResult } from './types/get-team-result.type';
import type { RemoveTeamMemberResult } from './types/remove-team-member-result.type';
import type { UpdateTeamResult } from './types/update-team-result.type';
import { TeamsService } from './teams.service';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('밴드 - 팀')
@Controller('bands')
export class BandTeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post(':bandId/teams')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '#53 팀 생성' })
  @ApiParam({ name: 'bandId', description: '밴드 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '팀 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '밴드 멤버가 아님' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
  async createTeam(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() input: CreateTeamBodyDto,
  ): Promise<ApiSuccessResponse<CreateTeamResult>> {
    const result = await this.teamsService.createTeam(request.user.id, bandId, input);
    return createSuccessResponse('팀 생성 성공', result);
  }

  @Get(':bandId/teams')
  @ApiOperation({ summary: '#54 밴드 팀 목록 조회' })
  @ApiParam({ name: 'bandId', description: '밴드 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '밴드 팀 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
  async getBandTeams(@Param('bandId') bandId: string, @Query() query: GetBandTeamsQueryDto): Promise<ApiSuccessResponse<GetBandTeamsResult>> {
    const result = await this.teamsService.getBandTeams(bandId, query);
    return createSuccessResponse('밴드 팀 목록 조회 성공', result);
  }
}

@ApiTags('팀')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '#55 내 팀 목록 조회' })
  @ApiResponse({ status: 200, description: '내 팀 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getMyTeams(@Req() request: AuthenticatedRequest, @Query() query: GetMyTeamsQueryDto): Promise<ApiSuccessResponse<GetMyTeamsResult>> {
    const result = await this.teamsService.getMyTeams(request.user.id, query);
    return createSuccessResponse('내 팀 목록 조회 성공', result);
  }

  @Get(':teamId')
  @ApiOperation({ summary: '#60 팀 상세 조회' })
  @ApiParam({ name: 'teamId', description: '팀 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '팀 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async getTeam(@Param('teamId') teamId: string): Promise<ApiSuccessResponse<GetTeamResult>> {
    const result = await this.teamsService.getTeam(teamId);
    return createSuccessResponse('팀 상세 조회 성공', result);
  }

  @Patch(':teamId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '#61 팀 정보 수정' })
  @ApiParam({ name: 'teamId', description: '팀 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '팀 정보 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '팀 리더 권한 필요' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async updateTeam(
    @Req() request: AuthenticatedRequest,
    @Param('teamId') teamId: string,
    @Body() input: UpdateTeamBodyDto,
  ): Promise<ApiSuccessResponse<UpdateTeamResult>> {
    const result = await this.teamsService.updateTeam(request.user.id, teamId, input);
    return createSuccessResponse('팀 정보 수정 성공', result);
  }

  @Get(':teamId/members')
  @ApiOperation({ summary: '#62 팀 멤버 목록 조회' })
  @ApiParam({ name: 'teamId', description: '팀 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '팀 멤버 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async getTeamMembers(@Param('teamId') teamId: string, @Query() query: GetTeamMembersQueryDto): Promise<ApiSuccessResponse<GetTeamMembersResult>> {
    const result = await this.teamsService.getTeamMembers(teamId, query);
    return createSuccessResponse('팀 멤버 목록 조회 성공', result);
  }

  @Patch(':teamId/leader')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '#63 팀 리더 변경' })
  @ApiParam({ name: 'teamId', description: '팀 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '팀 리더 변경 성공' })
  @ApiResponse({ status: 400, description: '이미 팀 리더 / 잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '팀 리더 권한 필요' })
  @ApiResponse({ status: 404, description: '팀 또는 팀 멤버를 찾을 수 없음' })
  async changeTeamLeader(
    @Req() request: AuthenticatedRequest,
    @Param('teamId') teamId: string,
    @Body() input: ChangeTeamLeaderBodyDto,
  ): Promise<ApiSuccessResponse<ChangeTeamLeaderResult>> {
    const result = await this.teamsService.changeTeamLeader(request.user.id, teamId, input);
    return createSuccessResponse('팀 리더 변경 성공', result);
  }

  @Delete(':teamId/members/:teamMemberId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '#64 팀 멤버 제거' })
  @ApiParam({ name: 'teamId', description: '팀 ID (UUID)', type: String })
  @ApiParam({ name: 'teamMemberId', description: '팀 멤버 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '팀 멤버 제거 성공' })
  @ApiResponse({ status: 400, description: '팀 리더는 자기 자신을 제거할 수 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '팀 리더 권한 필요' })
  @ApiResponse({ status: 404, description: '팀 또는 팀 멤버를 찾을 수 없음' })
  async removeTeamMember(
    @Req() request: AuthenticatedRequest,
    @Param('teamId') teamId: string,
    @Param('teamMemberId') teamMemberId: string,
  ): Promise<ApiSuccessResponse<RemoveTeamMemberResult>> {
    const result = await this.teamsService.removeTeamMember(request.user.id, teamId, teamMemberId);
    return createSuccessResponse('팀 멤버 제거 성공', result);
  }

  @Post(':teamId/members')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '#65 팀 멤버 추가' })
  @ApiParam({ name: 'teamId', description: '팀 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '팀 멤버 추가 성공' })
  @ApiResponse({ status: 400, description: '이미 팀 멤버 / 다른 밴드 멤버' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '팀 리더 권한 필요' })
  @ApiResponse({ status: 404, description: '팀 또는 밴드 멤버를 찾을 수 없음' })
  async addTeamMember(
    @Req() request: AuthenticatedRequest,
    @Param('teamId') teamId: string,
    @Body() input: AddTeamMemberBodyDto,
  ): Promise<ApiSuccessResponse<AddTeamMemberResult>> {
    const result = await this.teamsService.addTeamMember(request.user.id, teamId, input.bandMemberId, input.skillTypeId);
    return createSuccessResponse('팀 멤버 추가 성공', result);
  }

  @Delete(':teamId')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '#66 팀 삭제' })
  @ApiParam({ name: 'teamId', description: '팀 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '팀 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '팀 리더 권한 필요' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async deleteTeam(@Req() request: AuthenticatedRequest, @Param('teamId') teamId: string): Promise<ApiSuccessResponse<DeleteTeamResult>> {
    const result = await this.teamsService.deleteTeam(request.user.id, teamId);
    return createSuccessResponse('팀 삭제 성공', result);
  }
}

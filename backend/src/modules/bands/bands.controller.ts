import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { CreateBandBodyDto } from './dto/create-band.dto';
import { CreateBandInvitationBodyDto } from './dto/create-band-invitation.dto';
import { CreateBandJoinRequestBodyDto } from './dto/create-band-join-request.dto';
import { GetBandJoinRequestsQueryDto } from './dto/get-band-join-requests-query.dto';
import { GetBandMembersQueryDto } from './dto/get-band-members-query.dto';
import { GetMyBandsQueryDto } from './dto/get-my-bands-query.dto';
import { SearchBandsQueryDto } from './dto/search-bands-query.dto';
import { UpdateBandBodyDto } from './dto/update-band.dto';
import { UpdateBandMemberRoleBodyDto } from './dto/update-band-member-role.dto';
import type { GetBandJoinRequestsResult } from './types/band-join-request-list.type';
import type { GetBandMembersResult } from './types/band-member-list.type';
import type { SearchBandsResult } from './types/band-search-result.type';
import type { CreateBandInvitationResult } from './types/create-band-invitation-result.type';
import type { CreateBandJoinRequestResult } from './types/create-band-join-request-result.type';
import type { CreateBandResult } from './types/create-band-result.type';
import type { DeleteBandResult } from './types/delete-band-result.type';
import type { LeaveBandResult } from './types/leave-band-result.type';
import type { GetMyBandsResult } from './types/my-band-list.type';
import type { UpdateBandMemberRoleResult } from './types/update-band-member-role-result.type';
import type { UpdateBandResult } from './types/update-band-result.type';
import { BandsService } from './bands.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller('bands')
export class BandsController {
  constructor(private readonly bandsService: BandsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async createBand(@Req() request: AuthenticatedRequest, @Body() input: CreateBandBodyDto): Promise<ApiSuccessResponse<CreateBandResult>> {
    const createdBand = await this.bandsService.createBand(request.user.id, input);

    return createSuccessResponse('밴드 생성 성공', createdBand);
  }

  @Post(':bandId/invitations')
  @UseGuards(AccessTokenGuard)
  async createBandInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() input: CreateBandInvitationBodyDto,
  ): Promise<ApiSuccessResponse<CreateBandInvitationResult>> {
    const createdInvitation = await this.bandsService.createBandInvitation(request.user.id, bandId, input);

    return createSuccessResponse('밴드 초대 전송 완료', createdInvitation);
  }

  @Post(':bandId/join-requests')
  @UseGuards(AccessTokenGuard)
  async createBandJoinRequest(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() input: CreateBandJoinRequestBodyDto,
  ): Promise<ApiSuccessResponse<CreateBandJoinRequestResult>> {
    const createdJoinRequest = await this.bandsService.createBandJoinRequest(request.user.id, bandId, input);

    return createSuccessResponse('밴드 가입 요청 완료', createdJoinRequest);
  }

  @Get(':bandId/join-requests')
  @UseGuards(AccessTokenGuard)
  async getBandJoinRequests(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Query() query: GetBandJoinRequestsQueryDto,
  ): Promise<ApiSuccessResponse<GetBandJoinRequestsResult>> {
    const joinRequests = await this.bandsService.getBandJoinRequests(request.user.id, bandId, query);

    return createSuccessResponse('밴드 가입 요청 목록 조회 성공', joinRequests);
  }

  @Delete(':bandId/me')
  @UseGuards(AccessTokenGuard)
  async leaveBand(@Req() request: AuthenticatedRequest, @Param('bandId') bandId: string): Promise<ApiSuccessResponse<LeaveBandResult>> {
    const leftBand = await this.bandsService.leaveBand(request.user.id, bandId);

    return createSuccessResponse('밴드 나가기 완료', leftBand);
  }

  @Delete(':bandId')
  @UseGuards(AccessTokenGuard)
  async deleteBand(@Req() request: AuthenticatedRequest, @Param('bandId') bandId: string): Promise<ApiSuccessResponse<DeleteBandResult>> {
    const deletedBand = await this.bandsService.deleteBand(request.user.id, bandId);

    return createSuccessResponse('밴드가 삭제되었습니다.', deletedBand);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  async getMyBands(@Req() request: AuthenticatedRequest, @Query() query: GetMyBandsQueryDto): Promise<ApiSuccessResponse<GetMyBandsResult>> {
    const bands = await this.bandsService.getMyBands(request.user.id, query);

    return createSuccessResponse('내 밴드 목록 조회 성공', bands);
  }

  @Get('search')
  async searchBands(@Query() query: SearchBandsQueryDto): Promise<ApiSuccessResponse<SearchBandsResult>> {
    const bands = await this.bandsService.searchBands(query);

    return createSuccessResponse('밴드 검색 완료', bands);
  }

  @Patch(':bandId')
  @UseGuards(AccessTokenGuard)
  async updateBand(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() input: UpdateBandBodyDto,
  ): Promise<ApiSuccessResponse<UpdateBandResult>> {
    const updatedBand = await this.bandsService.updateBand(request.user.id, bandId, input);

    return createSuccessResponse('밴드 정보 수정 완료', updatedBand);
  }

  @Get(':bandId/users')
  async getBandMembers(@Param('bandId') bandId: string, @Query() query: GetBandMembersQueryDto): Promise<ApiSuccessResponse<GetBandMembersResult>> {
    const members = await this.bandsService.getBandMembers(bandId, query);

    return createSuccessResponse('밴드 내 멤버 조회 완료', members);
  }

  @Patch(':bandId/users/:userId')
  @UseGuards(AccessTokenGuard)
  async updateBandMemberRole(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Param('userId') userId: string,
    @Body() input: UpdateBandMemberRoleBodyDto,
  ): Promise<ApiSuccessResponse<UpdateBandMemberRoleResult>> {
    const updatedMember = await this.bandsService.updateBandMemberRole(request.user.id, bandId, userId, input);

    return createSuccessResponse('밴드 멤버 권한이 변경되었습니다.', updatedMember);
  }
}

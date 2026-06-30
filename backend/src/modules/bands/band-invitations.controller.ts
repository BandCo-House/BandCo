import { Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { AuthUser } from '../users/repositoreis/user.repository';

import { GetReceivedBandInvitationsQueryDto } from './dto/get-received-band-invitations-query.dto';
import { GetSentBandInvitationsQueryDto } from './dto/get-sent-band-invitations-query.dto';
import type { AcceptBandInvitationResult } from './types/accept-band-invitation-result.type';
import type { DeclineBandInvitationResult } from './types/decline-band-invitation-result.type';
import type { DeleteBandInvitationResult } from './types/delete-band-invitation-result.type';
import type { GetReceivedBandInvitationsResult } from './types/received-band-invitation-list.type';
import type { GetSentBandInvitationsResult } from './types/sent-band-invitation-list.type';
import { BandsService } from './bands.service';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('초대')
@ApiBearerAuth('access-token')
@Controller('invitations')
export class BandInvitationsController {
  constructor(private readonly bandsService: BandsService) {}

  @Get('received')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: '받은 밴드 초대 목록 조회' })
  @ApiResponse({ status: 200, description: '받은 초대 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getReceivedBandInvitations(
    @Req() request: AuthenticatedRequest,
    @Query() query: GetReceivedBandInvitationsQueryDto,
  ): Promise<ApiSuccessResponse<GetReceivedBandInvitationsResult>> {
    const invitations = await this.bandsService.getReceivedBandInvitations(request.user.id, query);

    return createSuccessResponse('받은 초대 목록 조회 성공', invitations);
  }

  @Get('sent')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: '보낸 밴드 초대 목록 조회' })
  @ApiResponse({ status: 200, description: '보낸 초대 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getSentBandInvitations(
    @Req() request: AuthenticatedRequest,
    @Query() query: GetSentBandInvitationsQueryDto,
  ): Promise<ApiSuccessResponse<GetSentBandInvitationsResult>> {
    const invitations = await this.bandsService.getSentBandInvitations(request.user.id, query);

    return createSuccessResponse('보낸 초대 목록 조회 성공', invitations);
  }

  @Post(':invitationId/accept')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: '밴드 초대 수락' })
  @ApiParam({ name: 'invitationId', description: '초대 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '밴드 초대 수락 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '초대를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 처리된 초대 / 이미 밴드 멤버' })
  async acceptBandInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ): Promise<ApiSuccessResponse<AcceptBandInvitationResult>> {
    const acceptedInvitation = await this.bandsService.acceptBandInvitation(request.user.id, invitationId);

    return createSuccessResponse('밴드 초대를 수락했습니다.', acceptedInvitation);
  }

  @Post(':invitationId/decline')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: '밴드 초대 거절' })
  @ApiParam({ name: 'invitationId', description: '초대 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '밴드 초대 거절 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '초대를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 처리된 초대' })
  async declineBandInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ): Promise<ApiSuccessResponse<DeclineBandInvitationResult>> {
    const declinedInvitation = await this.bandsService.declineBandInvitation(request.user.id, invitationId);

    return createSuccessResponse('밴드 초대를 거절했습니다.', declinedInvitation);
  }

  @Delete(':invitationId')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: '보낸 밴드 초대 취소' })
  @ApiParam({ name: 'invitationId', description: '초대 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '초대 취소 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '초대를 찾을 수 없음' })
  async deleteBandInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ): Promise<ApiSuccessResponse<DeleteBandInvitationResult>> {
    const deletedInvitation = await this.bandsService.deleteBandInvitation(request.user.id, invitationId);

    return createSuccessResponse('초대를 취소했습니다.', deletedInvitation);
  }
}

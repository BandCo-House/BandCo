import { Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { AuthUser } from '../users/repositoreis/user.repository';

import type { CreateBandInviteLinkResult, JoinBandByInviteLinkResult, RevokeBandInviteLinkResult } from './types/band-invite-link.type';
import { BandInviteLinksService } from './band-invite-links.service';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('밴드 초대 링크')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller()
export class BandInviteLinksController {
  constructor(private readonly bandInviteLinksService: BandInviteLinksService) {}

  @Post('bands/:bandId/invite-link')
  @ApiOperation({ summary: '밴드 초대 링크 발급·재발급' })
  @ApiParam({ name: 'bandId', description: '밴드 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '밴드 초대 링크 발급 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
  async createBandInviteLink(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
  ): Promise<ApiSuccessResponse<CreateBandInviteLinkResult>> {
    const inviteLink = await this.bandInviteLinksService.createBandInviteLink(request.user.id, bandId);

    return createSuccessResponse('밴드 초대 링크를 발급했습니다.', inviteLink);
  }

  @Delete('bands/:bandId/invite-link')
  @ApiOperation({ summary: '밴드 초대 링크 폐기' })
  @ApiParam({ name: 'bandId', description: '밴드 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '밴드 초대 링크 폐기 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '밴드 또는 초대 링크를 찾을 수 없음' })
  async revokeBandInviteLink(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
  ): Promise<ApiSuccessResponse<RevokeBandInviteLinkResult>> {
    const revokedLink = await this.bandInviteLinksService.revokeBandInviteLink(request.user.id, bandId);

    return createSuccessResponse('밴드 초대 링크를 폐기했습니다.', revokedLink);
  }

  @Post('invite-links/:code/join')
  @ApiOperation({ summary: '밴드 초대 링크 가입' })
  @ApiParam({ name: 'code', description: '밴드 초대 코드', type: String })
  @ApiResponse({ status: 201, description: '밴드 초대 링크 가입 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '차단된 사용자' })
  @ApiResponse({ status: 404, description: '유효한 초대 링크를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 밴드 멤버' })
  async joinBandByInviteLink(
    @Req() request: AuthenticatedRequest,
    @Param('code') code: string,
  ): Promise<ApiSuccessResponse<JoinBandByInviteLinkResult>> {
    const joinedBand = await this.bandInviteLinksService.joinBandByInviteLink(request.user.id, code);

    return createSuccessResponse('밴드에 가입했습니다.', joinedBand);
  }
}

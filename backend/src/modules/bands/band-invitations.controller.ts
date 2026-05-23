import { Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { GetReceivedBandInvitationsQueryDto } from './dto/get-received-band-invitations-query.dto';
import type { AcceptBandInvitationResult } from './types/accept-band-invitation-result.type';
import type { DeclineBandInvitationResult } from './types/decline-band-invitation-result.type';
import type { DeleteBandInvitationResult } from './types/delete-band-invitation-result.type';
import type { GetReceivedBandInvitationsResult } from './types/received-band-invitation-list.type';
import { BandsService } from './bands.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller('invitations')
export class BandInvitationsController {
  constructor(private readonly bandsService: BandsService) {}

  @Get('received')
  @UseGuards(AccessTokenGuard)
  async getReceivedBandInvitations(
    @Req() request: AuthenticatedRequest,
    @Query() query: GetReceivedBandInvitationsQueryDto,
  ): Promise<ApiSuccessResponse<GetReceivedBandInvitationsResult>> {
    const invitations = await this.bandsService.getReceivedBandInvitations(request.user.id, query);

    return createSuccessResponse('받은 초대 목록 조회 성공', invitations);
  }

  @Post(':invitationId/accept')
  @UseGuards(AccessTokenGuard)
  async acceptBandInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ): Promise<ApiSuccessResponse<AcceptBandInvitationResult>> {
    const acceptedInvitation = await this.bandsService.acceptBandInvitation(request.user.id, invitationId);

    return createSuccessResponse('밴드 초대를 수락했습니다.', acceptedInvitation);
  }

  @Post(':invitationId/decline')
  @UseGuards(AccessTokenGuard)
  async declineBandInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ): Promise<ApiSuccessResponse<DeclineBandInvitationResult>> {
    const declinedInvitation = await this.bandsService.declineBandInvitation(request.user.id, invitationId);

    return createSuccessResponse('밴드 초대를 거절했습니다.', declinedInvitation);
  }

  @Delete(':invitationId')
  @UseGuards(AccessTokenGuard)
  async deleteBandInvitation(
    @Req() request: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ): Promise<ApiSuccessResponse<DeleteBandInvitationResult>> {
    const deletedInvitation = await this.bandsService.deleteBandInvitation(request.user.id, invitationId);

    return createSuccessResponse('초대를 취소했습니다.', deletedInvitation);
  }
}

import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import type { AcceptBandInvitationResult } from './types/accept-band-invitation-result.type';
import type { DeclineBandInvitationResult } from './types/decline-band-invitation-result.type';
import { BandsService } from './bands.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller('invitations')
export class BandInvitationsController {
  constructor(private readonly bandsService: BandsService) {}

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
}

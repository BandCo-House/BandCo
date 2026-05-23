import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { GetSentBandJoinRequestsQueryDto } from './dto/get-sent-band-join-requests-query.dto';
import type { GetSentBandJoinRequestsResult } from './types/sent-band-join-request-list.type';
import { BandsService } from './bands.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller('join-requests')
export class BandJoinRequestsController {
  constructor(private readonly bandsService: BandsService) {}

  @Get('sent')
  @UseGuards(AccessTokenGuard)
  async getSentBandJoinRequests(
    @Req() request: AuthenticatedRequest,
    @Query() query: GetSentBandJoinRequestsQueryDto,
  ): Promise<ApiSuccessResponse<GetSentBandJoinRequestsResult>> {
    const joinRequests = await this.bandsService.getSentBandJoinRequests(request.user.id, query);

    return createSuccessResponse('내가 보낸 가입 요청 목록 조회 완료', joinRequests);
  }
}

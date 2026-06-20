import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { AuthUser } from '../users/repositoreis/user.repository';

import { GetSentBandJoinRequestsQueryDto } from './dto/get-sent-band-join-requests-query.dto';
import type { ApproveBandJoinRequestResult } from './types/approve-band-join-request-result.type';
import type { RejectBandJoinRequestResult } from './types/reject-band-join-request-result.type';
import type { GetSentBandJoinRequestsResult } from './types/sent-band-join-request-list.type';
import { BandsService } from './bands.service';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('가입 요청')
@Controller('join-requests')
export class BandJoinRequestsController {
  constructor(private readonly bandsService: BandsService) {}

  @Get('sent')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내가 보낸 가입 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '내가 보낸 가입 요청 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getSentBandJoinRequests(
    @Req() request: AuthenticatedRequest,
    @Query() query: GetSentBandJoinRequestsQueryDto,
  ): Promise<ApiSuccessResponse<GetSentBandJoinRequestsResult>> {
    const joinRequests = await this.bandsService.getSentBandJoinRequests(request.user.id, query);

    return createSuccessResponse('내가 보낸 가입 요청 목록 조회 완료', joinRequests);
  }

  @Post(':joinRequestId/approve')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '밴드 가입 요청 승인' })
  @ApiParam({ name: 'joinRequestId', description: '가입 요청 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '가입 요청 승인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '가입 요청을 찾을 수 없음' })
  async approveBandJoinRequest(
    @Req() request: AuthenticatedRequest,
    @Param('joinRequestId') joinRequestId: string,
  ): Promise<ApiSuccessResponse<ApproveBandJoinRequestResult>> {
    const approvedJoinRequest = await this.bandsService.approveBandJoinRequest(request.user.id, joinRequestId);

    return createSuccessResponse('밴드 가입 요청을 승인했습니다.', approvedJoinRequest);
  }

  @Post(':joinRequestId/reject')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '밴드 가입 요청 거절' })
  @ApiParam({ name: 'joinRequestId', description: '가입 요청 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '가입 요청 거절 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '가입 요청을 찾을 수 없음' })
  async rejectBandJoinRequest(
    @Req() request: AuthenticatedRequest,
    @Param('joinRequestId') joinRequestId: string,
  ): Promise<ApiSuccessResponse<RejectBandJoinRequestResult>> {
    const rejectedJoinRequest = await this.bandsService.rejectBandJoinRequest(request.user.id, joinRequestId);

    return createSuccessResponse('밴드 가입 요청을 거절했습니다.', rejectedJoinRequest);
  }
}

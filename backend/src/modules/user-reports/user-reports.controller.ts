import { Body, Controller, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from 'src/auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';
import type { AuthUser } from 'src/modules/users/repositoreis/user.repository';

import { CreateUserReportDto } from './dto/create-user-report.dto';
import type { CreateUserReportResult } from './types/user-report.type';
import { UserReportsService } from './user-reports.service';

@ApiTags('유저 신고')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller('users')
export class UserReportsController {
  constructor(private readonly userReportsService: UserReportsService) {}

  @Post(':userId/reports')
  @ApiOperation({ summary: '유저 신고' })
  @ApiParam({ name: 'userId', description: '신고 대상 유저 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '신고 접수 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패 또는 본인 신고' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '신고 대상 유저 없음 또는 탈퇴' })
  @ApiResponse({ status: 409, description: '같은 대상에게 처리 대기 중인 신고가 있음' })
  async createUserReport(
    @Req() request: { user: AuthUser },
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateUserReportDto,
  ): Promise<ApiSuccessResponse<CreateUserReportResult>> {
    const result = await this.userReportsService.createUserReport(request.user.id, userId, dto);
    return createSuccessResponse('신고가 접수되었습니다.', result);
  }
}

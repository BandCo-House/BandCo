import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { CurrentAdmin } from './decorator/current-admin.decorator';
import { AdminLoginDto, ChangeAdminPasswordDto } from './dto/admin-auth.dto';
import { AdminAccessTokenGuard, AdminRefreshTokenGuard } from './guard/admin-token.guard';
import type { AdminLoginResult, AdminPrincipal, AdminProfile, ChangeAdminPasswordResult } from './types/admin-principal.type';
import { AdminAuthService } from './admin-auth.service';

@ApiTags('어드민 - 인증')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @ApiOperation({ summary: '어드민 로그인' })
  @ApiResponse({ status: 201, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 401, description: '이메일 또는 비밀번호 불일치, 비활성 계정' })
  @ApiResponse({ status: 429, description: '같은 이메일 연속 실패 10회, 15분 잠금' })
  async login(@Body() dto: AdminLoginDto): Promise<ApiSuccessResponse<AdminLoginResult>> {
    const result = await this.adminAuthService.login(dto.email, dto.password);
    return createSuccessResponse('어드민 로그인 성공', result);
  }

  @Post('token/access')
  @UseGuards(AdminRefreshTokenGuard)
  @ApiBearerAuth('admin-refresh-token')
  @ApiOperation({ summary: '어드민 액세스 토큰 재발급' })
  @ApiResponse({ status: 201, description: '재발급 성공' })
  @ApiResponse({ status: 401, description: '리프레시 토큰 아님, 만료, 비활성 계정' })
  issueAccessToken(@CurrentAdmin() admin: AdminPrincipal): ApiSuccessResponse<{ accessToken: string }> {
    const accessToken = this.adminAuthService.signToken(admin.id, 'access');
    return createSuccessResponse('액세스 토큰 재발급 성공', { accessToken });
  }

  @Get('me')
  @UseGuards(AdminAccessTokenGuard)
  @ApiBearerAuth('admin-access-token')
  @ApiOperation({ summary: '내 어드민 정보 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getMe(@CurrentAdmin() admin: AdminPrincipal): Promise<ApiSuccessResponse<AdminProfile>> {
    const result = await this.adminAuthService.getMyProfile(admin.id);
    return createSuccessResponse('내 어드민 정보 조회 완료', result);
  }

  @Patch('me/password')
  @UseGuards(AdminAccessTokenGuard)
  @ApiBearerAuth('admin-access-token')
  @ApiOperation({ summary: '내 비밀번호 변경' })
  @ApiResponse({ status: 200, description: '변경 성공. 기존 토큰은 끊기고 새 토큰 쌍을 돌려준다' })
  @ApiResponse({ status: 400, description: '현재 비밀번호 불일치, 같은 비밀번호' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async changeMyPassword(
    @CurrentAdmin() admin: AdminPrincipal,
    @Body() dto: ChangeAdminPasswordDto,
  ): Promise<ApiSuccessResponse<ChangeAdminPasswordResult>> {
    const result = await this.adminAuthService.changeMyPassword(admin.id, dto.currentPassword, dto.newPassword);
    return createSuccessResponse('비밀번호 변경 완료', result);
  }
}

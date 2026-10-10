import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { type ApiSuccessResponse, createSuccessResponse } from '../common/api-response';

import { CheckEmailDto } from './dto/check-email.dto';
import { LoginGoogleDto } from './dto/login-google.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { BasicTokenGuard } from './guard/basic-token.guard';
import { RefreshTokenGuard } from './guard/bearer-token.guard';
import { AuthService } from './auth.service';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token/access')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: '액세스 토큰 재발급' })
  @ApiResponse({ status: 201, description: '액세스 토큰 재발급 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async TokenAccess(@Req() req: { user: { id: string; email: string } }): Promise<ApiSuccessResponse<{ accessToken: string }>> {
    const { email, id } = req.user;
    // 앱을 계속 쓰는 동안 액세스 토큰만 재발급되므로 여기서도 접속 시각을 남겨야 활성 유저 집계가 맞는다
    await this.authService.recordLastLogin(id);
    const accessToken = this.authService.signToken(email, id, false);
    return createSuccessResponse('액세스 토큰 재발급 성공', { accessToken });
  }

  @Post('token/refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: '리프레시 토큰 재발급' })
  @ApiResponse({ status: 201, description: '리프레시 토큰 재발급 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  TokenRefresh(@Req() req: { user: { id: string; email: string } }): ApiSuccessResponse<{ refreshToken: string }> {
    const { email, id } = req.user;
    const refreshToken = this.authService.signToken(email, id, true);
    return createSuccessResponse('리프레시 토큰 재발급 성공', { refreshToken });
  }

  @Post('login/email')
  @UseGuards(BasicTokenGuard)
  @ApiBasicAuth()
  @ApiOperation({ summary: '이메일 로그인' })
  @ApiResponse({ status: 201, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: 'Authorization 헤더 없음 | 잘못된 Basic 토큰 형식 | 존재하지 않는 유저 | 비밀번호 불일치' })
  @ApiResponse({ status: 403, description: '이용 정지된 계정' })
  async loginEmail(@Req() req: { user: { id: string; email: string } }): Promise<ApiSuccessResponse<{ accessToken: string; refreshToken: string }>> {
    // BasicTokenGuard가 인증을 마치고 req.user에 담은 유저로 토큰을 발급한다.
    const { email, id } = req.user;
    await this.authService.recordLastLogin(id);
    const tokens = this.authService.loginUser(email, id);
    return createSuccessResponse('로그인 성공', tokens);
  }

  @Post('login/google')
  @ApiOperation({ summary: 'Google 로그인' })
  @ApiResponse({ status: 201, description: '로그인 성공 (신규 가입·기존 연결 모두 동일 응답)' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패 (idToken 누락)' })
  @ApiResponse({ status: 401, description: '유효하지 않은 Google 토큰 | 이메일 미인증 Google 계정 | 탈퇴한 계정' })
  @ApiResponse({ status: 403, description: '이용 정지된 계정' })
  async loginGoogle(@Body() { idToken }: LoginGoogleDto): Promise<ApiSuccessResponse<{ accessToken: string; refreshToken: string }>> {
    const tokens = await this.authService.loginWithGoogle(idToken);
    return createSuccessResponse('로그인 성공', tokens);
  }

  @Post('register/email')
  @ApiOperation({ summary: '이메일 회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패 (이메일 형식 불일치, 비밀번호 패턴 불일치) | 이미 존재하는 이메일' })
  async registerEmail(
    @Body() { email, password, nickname }: RegisterEmailDto,
  ): Promise<ApiSuccessResponse<{ accessToken: string; refreshToken: string }>> {
    const tokens = await this.authService.registerWithEmail(email, password, nickname);
    return createSuccessResponse('회원가입 성공', tokens);
  }

  @Post('email')
  @ApiOperation({ summary: '이메일 중복 확인' })
  @ApiResponse({ status: 201, description: '이메일 중복 확인 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async checkEmail(@Body() { email }: CheckEmailDto): Promise<ApiSuccessResponse<{ email: string; duplicated: boolean }>> {
    const isDuplicate = await this.authService.checkEmailDuplicate(email);
    const message = isDuplicate ? '중복 된 이메일입니다.' : '사용할 수 있는 이메일입니다.';
    return createSuccessResponse(message, { email, duplicated: isDuplicate });
  }
}

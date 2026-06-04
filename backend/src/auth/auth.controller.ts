import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { type ApiSuccessResponse, createSuccessResponse } from '../common/api-response';

import { CheckEmailDto } from './dto/check-email.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { BasicTokenGuard } from './guard/basic-token.guard';
import { AccessTokenGuard, RefreshTokenGuard } from './guard/bearer-token.guard';
import { AuthService } from './auth.service';

@ApiTags('인증')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token/access')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '액세스 토큰 재발급' })
  @ApiResponse({ status: 201, description: '액세스 토큰 재발급 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  TokenAccess(@Headers('authorization') authHeader: string) {
    const token = this.authService.extractTokenFromHeader(authHeader, true);
    const newToken = this.authService.rotateToken(token, false);
    return { accessToken: newToken };
  }

  @Post('token/refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: '리프레시 토큰 재발급' })
  @ApiResponse({ status: 201, description: '리프레시 토큰 재발급 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  TokenRefresh(@Headers('authorization') authHeader: string) {
    const token = this.authService.extractTokenFromHeader(authHeader, true);
    const newToken = this.authService.rotateToken(token, true);
    return { refreshToken: newToken };
  }

  @Post('login/email')
  @UseGuards(BasicTokenGuard)
  @ApiBasicAuth()
  @ApiOperation({ summary: '이메일 로그인' })
  @ApiResponse({ status: 201, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async loginEmail(@Headers('authorization') authHeader: string) {
    const token = this.authService.extractTokenFromHeader(authHeader, false);
    const { email, password } = this.authService.decodeBasicToken(token);

    return this.authService.loginUser(email, password);
  }

  @Post('register/email')
  @ApiOperation({ summary: '이메일 회원가입' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async registerEmail(@Body() { email, password }: RegisterEmailDto) {
    return this.authService.registerWithEmail(email, password);
  }

  @Post('email')
  @ApiOperation({ summary: '이메일 중복 확인' })
  @ApiResponse({ status: 201, description: '이메일 중복 확인 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  async checkEmail(@Body() { email }: CheckEmailDto): Promise<ApiSuccessResponse<{ email: string }>> {
    const isDuplicate = await this.authService.checkEmailDuplicate(email);
    const message = isDuplicate ? '중복 된 이메일입니다.' : '사용할 수 있는 이메일입니다.';
    return createSuccessResponse(message, { email });
  }
}

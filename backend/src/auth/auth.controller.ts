import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { type ApiSuccessResponse, createSuccessResponse } from '../common/api-response';

import { CheckEmailDto } from './dto/check-email.dto';
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
  TokenAccess(@Req() req: { user: { id: string; email: string } }) {
    const { email, id } = req.user;
    const accessToken = this.authService.signToken(email, id, false);
    return { accessToken };
  }

  @Post('token/refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('refresh-token')
  @ApiOperation({ summary: '리프레시 토큰 재발급' })
  @ApiResponse({ status: 201, description: '리프레시 토큰 재발급 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  TokenRefresh(@Req() req: { user: { id: string; email: string } }) {
    const { email, id } = req.user;
    const refreshToken = this.authService.signToken(email, id, true);
    return { refreshToken };
  }

  @Post('login/email')
  @UseGuards(BasicTokenGuard)
  @ApiBasicAuth()
  @ApiOperation({ summary: '이메일 로그인' })
  @ApiResponse({ status: 201, description: '로그인 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async loginEmail(@Req() req: { user: { id: string; email: string } }) {
    // BasicTokenGuard가 인증을 마치고 req.user에 담은 유저로 토큰을 발급한다.
    const { email, id } = req.user;
    return this.authService.loginUser(email, id);
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

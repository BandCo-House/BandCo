import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../common/api-response';

import { CheckEmailDto } from './dto/check-email.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { BasicTokenGuard } from './guard/basic-token.guard';
import { AccessTokenGuard, RefreshTokenGuard } from './guard/bearer-token.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('token/access')
  @UseGuards(AccessTokenGuard)
  TokenAccess(@Headers('authorization') authHeader: string) {
    const token = this.authService.extractTokenFromHeader(authHeader, true);
    const newToken = this.authService.rotateToken(token, false);
    return { accessToken: newToken };
  }

  @Post('token/refresh')
  @UseGuards(RefreshTokenGuard)
  TokenRefresh(@Headers('authorization') authHeader: string) {
    const token = this.authService.extractTokenFromHeader(authHeader, true);
    const newToken = this.authService.rotateToken(token, true);
    return { refreshToken: newToken };
  }

  @Post('login/email')
  @UseGuards(BasicTokenGuard)
  async loginEmail(@Headers('authorization') authHeader: string) {
    const token = this.authService.extractTokenFromHeader(authHeader, false);
    const { email, password } = this.authService.decodeBasicToken(token);

    return this.authService.loginUser(email, password);
  }

  @Post('register/email')
  async registerEmail(@Body() { email, password }: RegisterEmailDto) {
    return this.authService.registerWithEmail(email, password);
  }

  @Post('email')
  async checkEmail(@Body() { email }: CheckEmailDto): Promise<ApiSuccessResponse<{ email: string }>> {
    const isDuplicate = await this.authService.checkEmailDuplicate(email);
    const message = isDuplicate ? '중복 된 이메일입니다.' : '사용할 수 있는 이메일입니다.';
    return createSuccessResponse(message, { email });
  }
}

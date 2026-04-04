import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('token/access')
  TokenAccess(@Headers('authorization') authHeader: string) {
    const token = this.authService.parseTokenFromHeader(authHeader, true);
    const newToken = this.authService.rotateToken(token, false);
    return { accessToken: newToken };
  }

  @Post('token/refresh')
  TokenRefresh(@Headers('authorization') authHeader: string) {
    const token = this.authService.parseTokenFromHeader(authHeader, true);
    const newToken = this.authService.rotateToken(token, true);
    return { refreshToken: newToken };
  }

  @Post('login/email')
  async loginEmail(@Headers('authorization') authHeader: string) {
    const token = this.authService.parseTokenFromHeader(authHeader, false);
    const { email, password } = this.authService.decodeBasicToken(token);

    return this.authService.loginWithEmail(email, password);
  }

  @Post('register/email')
  async registerEmail(@Body('email') email: string, @Body('password') password: string) {
    return this.authService.registerWithEmail(email, password);
  }
}

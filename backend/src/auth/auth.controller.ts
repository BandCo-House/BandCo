import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
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

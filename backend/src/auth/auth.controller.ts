import { Controller, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterEmailDto } from './dto/register-email.dto';
import { RefreshTokenGuard } from './guard/bearer-token.guard';
import { BasicTokenGuard } from './guard/basic-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('token/access')
  @UseGuards(RefreshTokenGuard)
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

    return this.authService.loginWithEmail(email, password);
  }

  @Post('register/email')
  async registerEmail(@Body() { email, password }: RegisterEmailDto) {
    return this.authService.registerWithEmail(email, password);
  }
}

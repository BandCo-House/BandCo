import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/modules/users/users.service';

import { JwtPayload } from './types/auth.types';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly bcryptSaltRounds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
    if (!this.jwtSecret) throw new Error('JWT_SECRET must not be empty');

    this.bcryptSaltRounds = parseInt(this.configService.getOrThrow<string>('BCRYPT_SALT_ROUNDS'), 10);
    if (isNaN(this.bcryptSaltRounds) || this.bcryptSaltRounds < 4 || this.bcryptSaltRounds > 15) {
      throw new Error('BCRYPT_SALT_ROUNDS must be a number between 4 and 15');
    }
  }

  async loginWithEmail(email: string, password: string) {
    const user = await this.authenticateWithEmailAndPassword(email, password);
    return this.loginUser(user.email, user.id);
  }

  signToken(email: string, id: string, isRefreshToken: boolean): string {
    const payload: JwtPayload = { email, id, type: isRefreshToken ? 'refresh' : 'access' };

    return this.jwtService.sign(payload, {
      secret: this.jwtSecret,
      expiresIn: isRefreshToken ? '1h' : '5m',
    });
  }

  loginUser(email: string, id: string) {
    const accessToken = this.signToken(email, id, false);
    const refreshToken = this.signToken(email, id, true);
    return { accessToken, refreshToken };
  }

  async authenticateWithEmailAndPassword(email: string, password: string): Promise<{ id: string; email: string }> {
    const user = await this.usersService.getUserForPasswordAuth(email);

    if (!user) {
      throw new UnauthorizedException('존재하지 않는 유저입니다.');
    }
    //이메일로 검색하지만 이메일이 없는 유저를 검색하는건 타입 정의가 엄격하지 않기 때문
    if (!user.email) {
      throw new UnauthorizedException('이메일이 없는 유저입니다.');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('비밀번호가 설정되지 않은 유저입니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    return {
      id: user.id,
      email: user.email,
    };
  }

  async checkEmailDuplicate(email: string): Promise<boolean> {
    const user = await this.usersService.getUserByEmail(email);
    return user !== null;
  }

  /**
   * 이메일과 비밀번호로 유저를 생성하고 토큰 쌍을 발급한다.
   * @param nickname 프로필 닉네임으로 저장할 이름
   */
  async registerWithEmail(email: string, password: string, nickname: string) {
    const hash = await bcrypt.hash(password, this.bcryptSaltRounds);
    const newUser = await this.usersService.createUserWithEmail(email, hash, nickname);
    return this.loginUser(newUser.email!, newUser.id);
  }

  decodeBasicToken(token: string) {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const split = decoded.split(':');
    if (split.length !== 2) {
      throw new UnauthorizedException('유효하지 않은 Basic 토큰입니다.');
    }
    const email = split[0];
    const password = split[1];
    return { email, password };
  }

  verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.jwtSecret,
    });
  }

  extractTokenFromHeader(rawToken: string, isBearer: boolean) {
    const splitToken = rawToken.split(' ');
    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('길이 또는 prefix가 잘못된 토큰 형식입니다.');
    }
    return splitToken[1];
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/database/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma';
import { UsersService } from 'src/modules/users/users.service';

import { JwtPayload } from './types/auth.types';
import { GoogleAuthClient } from './google-auth.client';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly bcryptSaltRounds: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly googleAuthClient: GoogleAuthClient,
    private readonly prisma: PrismaService,
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

  /**
   * Google ID 토큰으로 로그인한다.
   *
   * 이미 연결된 유저면 그대로 로그인하고, 연결이 없으면 동일 이메일 유저에
   * 자동 연결하며, 그것도 없으면 신규 유저를 생성한다. 조회→연결/생성이
   * 동시 요청과 겹치지 않도록 하나의 트랜잭션 안에서 처리한다.
   *
   * @param {string} idToken - Google Identity Services에서 받은 ID 토큰
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns 자체 JWT accessToken/refreshToken 쌍
   */
  async loginWithGoogle(idToken: string, tx?: Prisma.TransactionClient) {
    const googleUser = await this.googleAuthClient.verifyIdToken(idToken);

    // 미인증 이메일로 자동 연결을 허용하면 타인 이메일 사칭으로 계정 탈취가 가능하다
    if (!googleUser.emailVerified) {
      throw new UnauthorizedException('이메일 인증이 완료되지 않은 Google 계정입니다.');
    }

    const run = async (client: Prisma.TransactionClient): Promise<{ id: string; email: string }> => {
      // 1) 이미 연결된 Google 계정이면 해당 유저로 로그인한다
      const linkedUser = await this.usersService.getUserByOAuth('GOOGLE', googleUser.sub, client);
      if (linkedUser) return linkedUser;

      // 2) 동일 이메일 유저가 있으면 자동 연결한다 (탈퇴 계정은 차단)
      const emailUser = await this.usersService.getUserForOAuthLink(googleUser.email, client);
      if (emailUser) {
        if (emailUser.deletedAt !== null) {
          throw new UnauthorizedException('탈퇴한 계정입니다.');
        }
        await this.usersService.linkOAuthAccount(emailUser.id, 'GOOGLE', googleUser.sub, googleUser.email, client);
        return { id: emailUser.id, email: emailUser.email };
      }

      // 3) 신규 유저를 생성한다. 닉네임은 Google 이름, 없으면 이메일 앞부분을 쓴다
      const nickname = googleUser.name ?? googleUser.email.split('@')[0];
      const newUser = await this.usersService.createUserWithGoogle(
        { provider: 'GOOGLE', providerUserId: googleUser.sub, email: googleUser.email, nickname },
        client,
      );
      return { id: newUser.id, email: newUser.email! };
    };

    const user = tx ? await run(tx) : await this.prisma.$transaction(run);
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
  async registerWithEmail(email: string, password: string, nickname: string, tx?: Prisma.TransactionClient) {
    const hash = await bcrypt.hash(password, this.bcryptSaltRounds);
    const newUser = await this.usersService.createUserWithEmail(email, hash, nickname, tx);
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

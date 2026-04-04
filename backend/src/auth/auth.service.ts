import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types/auth.types';
import { MembersService } from 'src/modules/members/members.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly membersService: MembersService,
  ) {}

  async loginWithEmail(email: string, password: string) {
    const user = await this.authenticateWithEmailAndPassword(email, password);
    return this.loginUser(user.email, user.id);
  }

  signToken(email: string, id: string, isRefreshToken: boolean): string {
    const payload: JwtPayload = { email, id, type: isRefreshToken ? 'refresh' : 'access' };

    return this.jwtService.sign(payload, {
      secret: 'jamplay',
      expiresIn: isRefreshToken ? '1h' : '5m',
    });
  }

  loginUser(email: string, id: string) {
    const accessToken = this.signToken(email, id, false);
    const refreshToken = this.signToken(email, id, true);
    return { accessToken, refreshToken };
  }

  async authenticateWithEmailAndPassword(email: string, password: string): Promise<{ id: string; email: string }> {
    const user = await this.membersService.getUserByEmail(email);

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

  async registerWithEmail(email: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    const newUser = await this.membersService.createUserWithEmail(email, hash);
    return this.loginUser(email, newUser.id);
  }

  parseTokenFromHeader(header: string, isbearer: boolean) {
    {
      const splitToken = header.split(' ');
      const token = splitToken[1];
      const prefix = isbearer ? 'Bearer' : 'Basic';
      if (splitToken.length !== 2 || splitToken[0] !== prefix) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }
      return token;
    }
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
      secret: 'jamplay',
    });
  }

  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: 'jamplay',
    }) as JwtPayload;
    if (decoded.type !== (isRefreshToken ? 'refresh' : 'access')) {
      throw new UnauthorizedException('재발급은 refresh 토큰만 가능합니다.');
    }
    return this.signToken(decoded.email, decoded.id, isRefreshToken);
  }
}

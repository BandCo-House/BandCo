import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';

import type { GoogleUserPayload } from './types/auth.types';

@Injectable()
export class GoogleAuthClient {
  private readonly googleClientId: string;
  private readonly oauthClient: OAuth2Client;

  constructor(private readonly configService: ConfigService) {
    this.googleClientId = this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID');
    if (!this.googleClientId) throw new Error('GOOGLE_CLIENT_ID must not be empty');

    this.oauthClient = new OAuth2Client(this.googleClientId);
  }

  /**
   * Google ID 토큰의 서명·만료·audience를 검증하고 유저 정보를 추출한다.
   *
   * audience 검증으로 다른 서비스용으로 발급된 Google 토큰의 재사용을 차단한다.
   *
   * @param {string} idToken - 프론트가 Google Identity Services에서 받은 ID 토큰
   * @returns {Promise<GoogleUserPayload>} 검증된 Google 유저 정보
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserPayload> {
    let payload: TokenPayload | undefined;

    try {
      const ticket = await this.oauthClient.verifyIdToken({ idToken, audience: this.googleClientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('유효하지 않은 Google 토큰입니다.');
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('유효하지 않은 Google 토큰입니다.');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: payload.name ?? null,
      hostedDomain: payload.hd ?? null,
    };
  }
}

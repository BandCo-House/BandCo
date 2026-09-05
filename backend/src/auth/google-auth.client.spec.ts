import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import { GoogleAuthClient } from './google-auth.client';

const TEST_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

const mockConfigService = {
  getOrThrow: jest.fn(() => TEST_CLIENT_ID),
} as unknown as ConfigService;

// 실제 Google 서버 호출을 막기 위해 내부 OAuth2Client를 스텁으로 교체한다
const createClient = (verifyIdToken: jest.Mock) => {
  const client = new GoogleAuthClient(mockConfigService);
  Object.assign(client, { oauthClient: { verifyIdToken } });
  return client;
};

const createTicket = (payload: unknown) => ({ getPayload: () => payload });

describe('GoogleAuthClient', () => {
  describe('생성자 설정 검증', () => {
    it('GOOGLE_CLIENT_ID가 빈 문자열이면 초기화 시 에러를 던진다', () => {
      const emptyConfig = { getOrThrow: jest.fn(() => '') } as unknown as ConfigService;
      expect(() => new GoogleAuthClient(emptyConfig)).toThrow('GOOGLE_CLIENT_ID must not be empty');
    });
  });

  describe('verifyIdToken', () => {
    it('검증 성공 시 payload를 GoogleUserPayload로 매핑한다', async () => {
      const verify = jest.fn().mockResolvedValue(createTicket({ sub: 'sub-001', email: 'g@u.com', email_verified: true, name: '구글유저' }));

      await expect(createClient(verify).verifyIdToken('id-token')).resolves.toEqual({
        sub: 'sub-001',
        email: 'g@u.com',
        emailVerified: true,
        name: '구글유저',
      });
      expect(verify).toHaveBeenCalledWith({ idToken: 'id-token', audience: TEST_CLIENT_ID });
    });

    it('email_verified와 name이 없으면 각각 false와 null로 매핑한다', async () => {
      const verify = jest.fn().mockResolvedValue(createTicket({ sub: 'sub-001', email: 'g@u.com' }));

      await expect(createClient(verify).verifyIdToken('id-token')).resolves.toEqual({
        sub: 'sub-001',
        email: 'g@u.com',
        emailVerified: false,
        name: null,
      });
    });

    it('서명 검증에 실패하면 UnauthorizedException으로 변환한다', async () => {
      const verify = jest.fn().mockRejectedValue(new Error('invalid signature'));

      await expect(createClient(verify).verifyIdToken('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('payload에 sub나 email이 없으면 UnauthorizedException을 던진다', async () => {
      const verify = jest.fn().mockResolvedValue(createTicket({ sub: 'sub-001' }));

      await expect(createClient(verify).verifyIdToken('id-token')).rejects.toThrow(UnauthorizedException);
    });
  });
});

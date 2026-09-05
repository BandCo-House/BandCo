import type { OAuthProvider } from 'src/generated/prisma';

/** OAuth 신규 유저 생성 입력값 */
export type CreateOAuthUserInput = {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  nickname: string;
};

/** 동일 이메일 자동 연결 판단용 유저. 탈퇴 계정을 구분해야 하므로 deletedAt을 포함한다. */
export type OAuthLinkUser = {
  id: string;
  email: string;
  deletedAt: Date | null;
};

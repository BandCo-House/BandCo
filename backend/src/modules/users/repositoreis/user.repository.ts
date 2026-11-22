import type { OAuthProvider, Prisma, User } from 'src/generated/prisma';

import type { GetUsersQuery } from '../dto/get-users-query.dto';
import type { UpdateUserProfileData } from '../dto/update-user-profile.dto';
import type { CreateOAuthUserInput, OAuthLinkUser } from '../types/oauth-user.type';
import type { HandleState, UpdateHandleInput } from '../types/user-handle.type';
import type { GetUsersResult } from '../types/user-list.type';
import type { UserProfileRecord } from '../types/user-profile.type';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export type AuthUser = {
  id: string;
  email: string;
};

export type PasswordAuthUser = AuthUser & {
  passwordHash: string | null;
};

/** 현재 효력이 있는 이용 정지 정보. endsAt이 null이면 영구 정지다. */
export type ActiveSuspension = {
  endsAt: Date | null;
};

export type DeleteUserResult = {
  userId: string;
  deletedAt: string;
};

export interface UsersRepository {
  findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<AuthUser | null>;
  findAuthUserById(id: string, tx?: Prisma.TransactionClient): Promise<AuthUser | null>;
  findUserForPasswordAuth(email: string, tx?: Prisma.TransactionClient): Promise<PasswordAuthUser | null>;
  /** 이메일 유저와 프로필을 만든다. handle은 서버가 고른 랜덤 고유 ID로 저장하고 handleGenerated=true로 표시한다 */
  createUserWithEmail(email: string, passwordHash: string, nickname: string, handle: string, tx?: Prisma.TransactionClient): Promise<User>;
  findUserByOAuth(provider: OAuthProvider, providerUserId: string, tx?: Prisma.TransactionClient): Promise<AuthUser | null>;
  findUserForOAuthLink(email: string, tx?: Prisma.TransactionClient): Promise<OAuthLinkUser | null>;
  createOAuthAccount(userId: string, provider: OAuthProvider, providerUserId: string, email: string, tx?: Prisma.TransactionClient): Promise<void>;
  /** OAuth 유저·프로필·연결을 만든다. handle 처리는 createUserWithEmail과 같다 */
  createUserWithOAuth(input: CreateOAuthUserInput, handle: string, tx?: Prisma.TransactionClient): Promise<User>;
  findUsers(query: GetUsersQuery, tx?: Prisma.TransactionClient): Promise<GetUsersResult>;
  findUserProfileById(userId: string, tx?: Prisma.TransactionClient): Promise<UserProfileRecord | null>;
  updateUserProfile(userId: string, data: UpdateUserProfileData, tx?: Prisma.TransactionClient): Promise<UserProfileRecord>;
  /** 탈퇴 처리한다. 원래 고유 ID를 풀도록 replacementHandle(랜덤)로 바꾸고 handleGenerated=true, handleChangedAt=null로 둔다 */
  softDeleteUser(userId: string, replacementHandle: string, tx?: Prisma.TransactionClient): Promise<DeleteUserResult | null>;
  findActiveSuspension(userId: string, now: Date, tx?: Prisma.TransactionClient): Promise<ActiveSuspension | null>;
  updateLastLoginAt(userId: string, now: Date, skipIfAfter: Date, tx?: Prisma.TransactionClient): Promise<void>;
  /**
   * 대소문자를 무시하고 같은 고유 ID를 쓰는 유저의 id를 돌려준다.
   * 탈퇴 유저가 아직 쥐고 있는 값도 유니크 인덱스에 걸리는 충돌이라 탈퇴 여부를 따지지 않는다.
   */
  findUserIdByHandle(handle: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;
  /** 쿨다운 판정에 필요한 현재 고유 ID, 랜덤 여부, 쿨다운 기준 시각. 탈퇴 유저면 null */
  findHandleState(userId: string, tx?: Prisma.TransactionClient): Promise<HandleState | null>;
  /**
   * 유저가 고른 고유 ID를 저장하고 handleGenerated=false로 둔다. 현재 값이 input.currentHandle과 다르면(읽은 뒤 다른 요청이 먼저 바꿈) 저장하지 않고 false를 돌려준다.
   * 유니크 위반(P2002)은 그대로 던진다.
   */
  updateHandle(userId: string, input: UpdateHandleInput, tx?: Prisma.TransactionClient): Promise<boolean>;
}

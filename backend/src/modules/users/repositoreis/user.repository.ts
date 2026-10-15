import type { OAuthProvider, Prisma, User } from 'src/generated/prisma';

import type { GetUsersQuery } from '../dto/get-users-query.dto';
import type { UpdateUserProfileData } from '../dto/update-user-profile.dto';
import type { CreateOAuthUserInput, OAuthLinkUser } from '../types/oauth-user.type';
import type { GetUsersResult } from '../types/user-list.type';
import type { GetUserProfileResult } from '../types/user-profile.type';

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
  createUserWithEmail(email: string, passwordHash: string, nickname: string, tx?: Prisma.TransactionClient): Promise<User>;
  findUserByOAuth(provider: OAuthProvider, providerUserId: string, tx?: Prisma.TransactionClient): Promise<AuthUser | null>;
  findUserForOAuthLink(email: string, tx?: Prisma.TransactionClient): Promise<OAuthLinkUser | null>;
  createOAuthAccount(userId: string, provider: OAuthProvider, providerUserId: string, email: string, tx?: Prisma.TransactionClient): Promise<void>;
  createUserWithOAuth(input: CreateOAuthUserInput, tx?: Prisma.TransactionClient): Promise<User>;
  findUsers(query: GetUsersQuery, tx?: Prisma.TransactionClient): Promise<GetUsersResult>;
  findUserProfileById(userId: string, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult | null>;
  updateUserProfile(userId: string, data: UpdateUserProfileData, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult>;
  softDeleteUser(userId: string, tx?: Prisma.TransactionClient): Promise<DeleteUserResult | null>;
  findActiveSuspension(userId: string, now: Date, tx?: Prisma.TransactionClient): Promise<ActiveSuspension | null>;
  updateLastLoginAt(userId: string, now: Date, skipIfAfter: Date, tx?: Prisma.TransactionClient): Promise<void>;
}

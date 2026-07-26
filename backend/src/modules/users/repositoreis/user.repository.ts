import type { Prisma, User } from 'src/generated/prisma';

import type { GetUsersQuery } from '../dto/get-users-query.dto';
import type { UpdateUserProfileData } from '../dto/update-user-profile.dto';
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

export type DeleteUserResult = {
  userId: string;
  deletedAt: string;
};

export interface UsersRepository {
  findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<AuthUser | null>;
  findAuthUserById(id: string, tx?: Prisma.TransactionClient): Promise<AuthUser | null>;
  findUserForPasswordAuth(email: string, tx?: Prisma.TransactionClient): Promise<PasswordAuthUser | null>;
  createUserWithEmail(email: string, passwordHash: string, nickname?: string, tx?: Prisma.TransactionClient): Promise<User>;
  findUsers(query: GetUsersQuery, tx?: Prisma.TransactionClient): Promise<GetUsersResult>;
  findUserProfileById(userId: string, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult | null>;
  updateUserProfile(userId: string, data: UpdateUserProfileData, tx?: Prisma.TransactionClient): Promise<GetUserProfileResult>;
  softDeleteUser(userId: string, tx?: Prisma.TransactionClient): Promise<DeleteUserResult | null>;
}

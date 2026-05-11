import type { Prisma, User } from 'src/generated/prisma';

import type { GetUsersQuery } from '../dto/get-users-query.dto';
import type { GetUsersResult } from '../types/user-list.type';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersRepository {
  findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<User | null>;
  createUserWithEmail(email: string, passwordHash: string, tx?: Prisma.TransactionClient): Promise<User>;
  findUsers(query: GetUsersQuery, tx?: Prisma.TransactionClient): Promise<GetUsersResult>;
}

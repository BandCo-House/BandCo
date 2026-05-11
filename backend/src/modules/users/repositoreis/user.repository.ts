import type { Prisma, User } from 'src/generated/prisma';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersRepository {
  findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<User | null>;
  createUserWithEmail(email: string, passwordHash: string, tx?: Prisma.TransactionClient): Promise<User>;
}

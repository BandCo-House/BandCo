import type { User } from 'src/generated/prisma';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersRepository {
  findByEmail(email: string): Promise<User | null>;
  createUserWithEmail(email: string, passwordHash: string): Promise<User>;
}

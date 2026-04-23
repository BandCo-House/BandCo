import { User } from 'src/generated/prisma';

export const MEMBERS_REPOSITORY = Symbol('MEMBERS_REPOSITORY');

export interface MembersRepository {
  findByEmail(email: string): Promise<User | null>;
  createUserWithEmail(email: string, passwordHash: string): Promise<User>;
}

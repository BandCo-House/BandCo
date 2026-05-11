import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma';
import { User } from 'src/generated/prisma';

import { generateRandomNickname } from '../util/nickname_maker';

import { UsersRepository } from './user.repository';

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string, tx?: Prisma.TransactionClient): Promise<User | null> {
    const client = tx ?? this.prisma;
    return client.user.findUnique({
      where: { email },
    });
  }

  async createUserWithEmail(email: string, passwordHash: string, tx?: Prisma.TransactionClient): Promise<User> {
    const run = async (client: Prisma.TransactionClient) => {
      const user = await client.user.create({
        data: { email, passwordHash },
      });

      await client.userProfile.create({
        data: {
          userId: user.id,
          nickname: generateRandomNickname(),
        },
      });

      return user;
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { User } from 'src/generated/prisma';

import { generateRandomNickname } from '../util/nickname_maker';

import { UsersRepository } from './user.repository';

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUserWithEmail(email: string, passwordHash: string): Promise<User> {
    return this.prisma.$transaction(async tx => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          nickname: generateRandomNickname(),
        },
      });

      return user;
    });
  }
}

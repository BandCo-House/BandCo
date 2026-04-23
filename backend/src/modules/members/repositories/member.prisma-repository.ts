import { User } from 'src/generated/prisma';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { MembersRepository } from './member.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MembersPrismaRepository implements MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUserWithEmail(email: string, passwordHash: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });
  }
}

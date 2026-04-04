import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}
  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return user;
  }

  async createUserWithEmail(email: string, passwordHash: string) {
    const emailExists = await this.prisma.user.count({
      where: { email },
    });
    if (emailExists > 0) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });
    return newUser;
  }
}

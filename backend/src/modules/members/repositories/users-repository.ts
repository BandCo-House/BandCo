import { NotFoundException } from '@nestjs/common/exceptions/not-found.exception';
import { PrismaService } from 'src/database/prisma/prisma.service';

export class UserRepository {
  constructor(private readonly prismaservice: PrismaService) {}

  async findUserByEmail(email: string) {
    const find_user = await this.prismaservice.user.findUnique({
      where: {
        email,
      },
    });
    if (!find_user) {
      throw new NotFoundException('해당 이메일로 가입된 사용자가 없습니다.');
    }
    return find_user;
  }
}

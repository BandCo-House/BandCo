import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { MembersPrismaRepository } from './repositories/member.prisma-repository';
import { MEMBERS_REPOSITORY, MembersRepository } from './repositories/member.repository';

@Injectable()
export class MembersService {
  constructor(
    @Inject(MEMBERS_REPOSITORY)
    private readonly membersRepository: MembersRepository,
  ) {}
  async getUserByEmail(email: string) {
    const user = await this.membersRepository.findByEmail(email);
    if (!user) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async createUserWithEmail(email: string, passwordHash: string) {
    const existingUser = await this.membersRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }
    return this.membersRepository.createUserWithEmail(email, passwordHash);
  }
}

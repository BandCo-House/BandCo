import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY, UsersRepository } from './repositoreis/user.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}
  async getUserByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    return user;
  }

  async createUserWithEmail(email: string, passwordHash: string) {
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }
    return this.usersRepository.createUserWithEmail(email, passwordHash);
  }
}

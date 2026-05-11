import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma';

import type { GetUsersQuery } from './dto/get-users-query.dto';
import { USERS_REPOSITORY, UsersRepository } from './repositoreis/user.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  async getUserByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async createUserWithEmail(email: string, passwordHash: string, tx?: Prisma.TransactionClient) {
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }
    return this.usersRepository.createUserWithEmail(email, passwordHash, tx);
  }

  async getUsers(query: GetUsersQuery) {
    return this.usersRepository.findUsers(query);
  }

  async getUserProfile(userId: string) {
    const result = await this.usersRepository.findUserProfileById(userId);
    if (!result) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }
    return result;
  }
}

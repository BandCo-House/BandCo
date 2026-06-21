import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma';

import type { GetUsersQuery } from './dto/get-users-query.dto';
import type { UpdateUserProfileData } from './dto/update-user-profile.dto';
import { USERS_REPOSITORY, UsersRepository } from './repositoreis/user.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  async getUserByEmail(email: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findByEmail(email, tx);
  }

  async getAuthUserById(id: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findAuthUserById(id, tx);
  }

  async getUserForPasswordAuth(email: string, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findUserForPasswordAuth(email, tx);
  }

  async createUserWithEmail(email: string, passwordHash: string, tx?: Prisma.TransactionClient) {
    const existingUser = await this.usersRepository.findByEmail(email, tx);
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }
    return this.usersRepository.createUserWithEmail(email, passwordHash, tx);
  }

  async getUsers(query: GetUsersQuery, tx?: Prisma.TransactionClient) {
    return this.usersRepository.findUsers(query, tx);
  }

  async getUserProfile(userId: string, tx?: Prisma.TransactionClient) {
    const result = await this.usersRepository.findUserProfileById(userId, tx);
    if (!result) {
      throw new NotFoundException('존재하지 않는 유저입니다.');
    }
    return result;
  }

  async updateUserProfile(userId: string, data: UpdateUserProfileData, tx?: Prisma.TransactionClient) {
    return this.usersRepository.updateUserProfile(userId, data, tx);
  }
}

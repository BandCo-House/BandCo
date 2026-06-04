import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { User } from 'src/generated/prisma';

import type { GetUsersQuery } from './dto/get-users-query.dto';
import type { UsersRepository } from './repositoreis/user.repository';
import { USERS_REPOSITORY } from './repositoreis/user.repository';
import type { GetUsersResult } from './types/user-list.type';
import type { GetUserProfileResult } from './types/user-profile.type';
import { UsersService } from './users.service';

const mockUser = { id: 'user-001', email: 'test@example.com' } as User;

const mockProfile: GetUserProfileResult = {
  user: { id: 'user-001', email: 'test@example.com', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z' },
  profile: { nickname: 'testuser', selfDescription: null, profileMusicUrl: null, avatarUrl: null },
  skills: [],
  favoriteGenres: [],
};

const mockListResult: GetUsersResult = {
  items: [
    { id: 'user-001', email: 'test@example.com', nickname: 'testuser', status: 'ACTIVE', avatarUrl: null, createdAt: '2026-01-01T00:00:00.000Z' },
  ],
  meta: { count: 1, take: 20, cursor: { createdAt: '2026-01-01T00:00:00.000Z', id: 'user-001' }, next: null },
};

const repositoryStub: UsersRepository = {
  async findByEmail(email) {
    return email === 'test@example.com' ? mockUser : null;
  },
  async createUserWithEmail(email) {
    return { ...mockUser, email } as User;
  },
  async findUsers() {
    return mockListResult;
  },
  async findUserProfileById(userId) {
    return userId === 'user-001' ? mockProfile : null;
  },
  async updateUserProfile() {
    return mockProfile;
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: USERS_REPOSITORY, useValue: repositoryStub }],
    }).compile();

    service = module.get(UsersService);
  });

  describe('getUserByEmail', () => {
    it('이메일이 존재하면 유저를 반환한다', async () => {
      const result = await service.getUserByEmail('test@example.com');
      expect(result?.id).toBe('user-001');
    });

    it('이메일이 없으면 null을 반환한다', async () => {
      const result = await service.getUserByEmail('none@example.com');
      expect(result).toBeNull();
    });
  });

  describe('createUserWithEmail', () => {
    it('이미 존재하는 이메일이면 BadRequestException을 던진다', async () => {
      await expect(service.createUserWithEmail('test@example.com', 'hashed')).rejects.toThrow(BadRequestException);
    });

    it('새 이메일이면 유저를 생성하여 반환한다', async () => {
      const result = await service.createUserWithEmail('new@example.com', 'hashed');
      expect(result.email).toBe('new@example.com');
    });
  });

  describe('getUsers', () => {
    it('repository 결과를 그대로 반환한다', async () => {
      const query: GetUsersQuery = { order__created_at: 'desc', order__id: 'desc', take: 20 };
      const result = await service.getUsers(query);
      expect(result.items).toHaveLength(1);
      expect(result.meta.count).toBe(1);
    });
  });

  describe('getUserProfile', () => {
    it('유저가 존재하면 프로필을 반환한다', async () => {
      const result = await service.getUserProfile('user-001');
      expect(result.user.id).toBe('user-001');
      expect(result.profile?.nickname).toBe('testuser');
    });

    it('유저가 존재하지 않으면 NotFoundException을 던진다', async () => {
      await expect(service.getUserProfile('unknown-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateUserProfile', () => {
    it('repository 결과를 그대로 반환한다', async () => {
      const result = await service.updateUserProfile('user-001', { profile: { nickname: '새닉네임' } });
      expect(result.user.id).toBe('user-001');
    });
  });
});

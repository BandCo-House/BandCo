import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { User } from 'src/generated/prisma';

import { DeezerTrackClient } from '../songs/deezer-track.client';

import type { GetUsersQuery } from './dto/get-users-query.dto';
import type { UsersRepository } from './repositoreis/user.repository';
import { USERS_REPOSITORY } from './repositoreis/user.repository';
import type { GetUsersResult } from './types/user-list.type';
import type { GetUserProfileResult } from './types/user-profile.type';
import { UsersService } from './users.service';

const mockUser = { id: 'user-001', email: 'test@example.com' } as User;

const mockProfile: GetUserProfileResult = {
  user: { id: 'user-001', email: 'test@example.com', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z' },
  profile: { nickname: 'testuser', selfDescription: null, profileMusic: null, avatarUrl: null },
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

const mockDeezerTracks = [
  {
    id: 123456789,
    title: 'Bohemian Rhapsody',
    duration: 354,
    preview: 'https://cdn.deezer.com/preview/abc123.mp3',
    link: 'https://www.deezer.com/track/123456789',
    artist: { name: 'Queen' },
    album: {
      title: 'A Night at the Opera',
      cover: null,
      cover_medium: null,
      cover_big: null,
      cover_xl: 'https://cdn.deezer.com/images/cover_xl.jpg',
    },
  },
];

const deezerClientStub = {
  searchTracks: jest.fn().mockResolvedValue(mockDeezerTracks),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: USERS_REPOSITORY, useValue: repositoryStub }, { provide: DeezerTrackClient, useValue: deezerClientStub }],
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

  describe('searchProfileMusicPreviews', () => {
    it('검색어가 있으면 Deezer 결과를 ProfileMusicPreview 목록으로 반환한다', async () => {
      const result = await service.searchProfileMusicPreviews('Bohemian Rhapsody');
      expect(deezerClientStub.searchTracks).toHaveBeenCalledWith('Bohemian Rhapsody');
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Bohemian Rhapsody');
      expect(result[0].artistName).toBe('Queen');
      expect(result[0].sourceType).toBe('DEEZER');
    });

    it('반환 결과에 releaseDate 필드가 없다', async () => {
      const result = await service.searchProfileMusicPreviews('Queen');
      expect(result[0]).not.toHaveProperty('releaseDate');
    });

    it('Deezer API가 빈 배열을 반환하면 빈 배열을 반환한다', async () => {
      deezerClientStub.searchTracks.mockResolvedValueOnce([]);
      const result = await service.searchProfileMusicPreviews('없는곡');
      expect(result).toHaveLength(0);
    });

    it('Deezer API가 실패하면 예외가 전파된다', async () => {
      const { BadGatewayException } = await import('@nestjs/common');
      deezerClientStub.searchTracks.mockRejectedValueOnce(new BadGatewayException('Deezer 실패'));
      await expect(service.searchProfileMusicPreviews('Queen')).rejects.toThrow(BadGatewayException);
    });
  });
});

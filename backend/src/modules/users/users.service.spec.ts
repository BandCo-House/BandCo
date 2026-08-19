import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { User } from 'src/generated/prisma';
import { Prisma } from 'src/generated/prisma';
import type { DeezerTrackClient } from 'src/modules/songs/deezer-track.client';
import type { DeezerTrackApiResponse } from 'src/modules/songs/types/deezer-track-api-response.type';

import type { GetUsersQuery } from './dto/get-users-query.dto';
import type { ProfileMusicRepository } from './repositoreis/profile-music.repository';
import type { UsersRepository } from './repositoreis/user.repository';
import type { DeleteProfileMusicResult, ProfileMusicTrack } from './types/profile-music.type';
import type { GetUsersResult } from './types/user-list.type';
import type { GetUserProfileResult } from './types/user-profile.type';
import { UsersService } from './users.service';

const mockUser = { id: 'user-001', email: 'test@example.com' };

const mockProfileMusic: ProfileMusicTrack = {
  externalTrackId: '12345',
  sourceType: 'DEEZER',
  title: 'Blinding Lights',
  artistName: 'The Weeknd',
  albumName: 'After Hours',
  albumImageUrl: null,
  durationMs: 200000,
  previewUrl: null,
  sourceUrl: 'https://www.deezer.com/track/12345',
};

const mockProfile: GetUserProfileResult = {
  user: { id: 'user-001', email: 'test@example.com', status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z' },
  profile: { nickname: 'testuser', selfDescription: null, avatarUrl: null },
  profileMusic: null,
  skills: [],
  favoriteGenres: [],
};

const mockListResult: GetUsersResult = {
  items: [
    { id: 'user-001', email: 'test@example.com', nickname: 'testuser', status: 'ACTIVE', avatarUrl: null, createdAt: '2026-01-01T00:00:00.000Z' },
  ],
  meta: { count: 1, take: 20, cursor: { createdAt: '2026-01-01T00:00:00.000Z', id: 'user-001' }, next: null },
};

const mockDeleteResult = { userId: 'user-001', deletedAt: '2026-06-25T00:00:00.000Z' };
const mockDeleteProfileMusicResult: DeleteProfileMusicResult = { userId: 'user-001', deletedAt: '2026-06-26T00:00:00.000Z' };

const mockDeezerTrack: DeezerTrackApiResponse = {
  id: 12345,
  title: 'Blinding Lights',
  duration: 200,
  link: 'https://www.deezer.com/track/12345',
  preview: null,
  artist: { name: 'The Weeknd' },
  album: { title: 'After Hours', cover: '', cover_medium: '', cover_big: '', cover_xl: '' },
};

const repositoryStub: UsersRepository = {
  async findByEmail(email) {
    return email === 'test@example.com' ? mockUser : null;
  },
  async findAuthUserById(id) {
    return id === 'user-001' ? mockUser : null;
  },
  async findUserForPasswordAuth(email) {
    return email === 'test@example.com' ? { id: 'user-001', email: 'test@example.com', passwordHash: 'hash' } : null;
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
  async softDeleteUser(userId) {
    return userId === 'user-001' ? mockDeleteResult : null;
  },
};

const profileMusicRepositoryStub: ProfileMusicRepository = {
  async findByUserId(userId) {
    return userId === 'user-001' ? mockProfileMusic : null;
  },
  async upsertByUserId(_userId, trackData) {
    return trackData;
  },
  async deleteByUserId(userId) {
    return userId === 'user-001' ? mockDeleteProfileMusicResult : null;
  },
};

const deezerTrackClientStub = {
  async searchTracks(_query: string): Promise<DeezerTrackApiResponse[]> {
    return [mockDeezerTrack];
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService(repositoryStub, profileMusicRepositoryStub, deezerTrackClientStub as unknown as DeezerTrackClient);
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

  describe('getAuthUserById', () => {
    it('id가 존재하면 인증용 유저 정보를 반환한다', async () => {
      const result = await service.getAuthUserById('user-001');
      expect(result).toEqual({ id: 'user-001', email: 'test@example.com' });
    });

    it('id가 없으면 null을 반환한다', async () => {
      const result = await service.getAuthUserById('unknown-id');
      expect(result).toBeNull();
    });
  });

  describe('getUserForPasswordAuth', () => {
    it('이메일이 존재하면 passwordHash를 포함한 로그인용 유저 정보를 반환한다', async () => {
      const result = await service.getUserForPasswordAuth('test@example.com');
      expect(result).toEqual({ id: 'user-001', email: 'test@example.com', passwordHash: 'hash' });
    });

    it('이메일이 없으면 null을 반환한다', async () => {
      const result = await service.getUserForPasswordAuth('none@example.com');
      expect(result).toBeNull();
    });
  });

  describe('createUserWithEmail', () => {
    it('이미 존재하는 이메일이면 BadRequestException을 던진다', async () => {
      await expect(service.createUserWithEmail('test@example.com', 'hashed', '홍길동')).rejects.toThrow(BadRequestException);
    });

    it('새 이메일이면 유저를 생성하여 반환한다', async () => {
      const result = await service.createUserWithEmail('new@example.com', 'hashed', '홍길동');
      expect(result.email).toBe('new@example.com');
    });

    it('생성 중 P2002가 발생하면 BadRequestException으로 변환한다', async () => {
      const conflict = new Prisma.PrismaClientKnownRequestError('unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      });
      const createSpy = jest.spyOn(repositoryStub, 'createUserWithEmail').mockRejectedValueOnce(conflict);

      await expect(service.createUserWithEmail('new@example.com', 'hashed', '홍길동')).rejects.toThrow(BadRequestException);
      createSpy.mockRestore();
    });

    it('P2002 이외의 오류는 그대로 전파한다', async () => {
      const unexpected = new Error('db down');
      const createSpy = jest.spyOn(repositoryStub, 'createUserWithEmail').mockRejectedValueOnce(unexpected);

      await expect(service.createUserWithEmail('new@example.com', 'hashed', '홍길동')).rejects.toThrow(unexpected);
      createSpy.mockRestore();
    });

    it('nickname과 tx를 repository에 그대로 전달한다', async () => {
      const createSpy = jest.spyOn(repositoryStub, 'createUserWithEmail');
      const tx = {} as Prisma.TransactionClient;

      await service.createUserWithEmail('new@example.com', 'hashed', '홍길동', tx);

      expect(createSpy).toHaveBeenCalledWith('new@example.com', 'hashed', '홍길동', tx);
      createSpy.mockRestore();
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

  describe('deleteUser', () => {
    it('유저가 존재하면 탈퇴 결과를 반환한다', async () => {
      const result = await service.deleteUser('user-001');
      expect(result.userId).toBe('user-001');
      expect(result.deletedAt).toBeDefined();
    });

    it('유저가 존재하지 않으면 NotFoundException을 던진다', async () => {
      await expect(service.deleteUser('unknown-id')).rejects.toThrow(NotFoundException);
    });

    it('tx가 전달되면 softDeleteUser에 동일한 tx를 전달한다', async () => {
      const txClient = {} as Prisma.TransactionClient;
      const deleteSpy = jest.spyOn(repositoryStub, 'softDeleteUser');

      await service.deleteUser('user-001', txClient);

      expect(deleteSpy).toHaveBeenCalledWith('user-001', txClient);
      deleteSpy.mockRestore();
    });
  });

  describe('searchProfileMusic', () => {
    it('Deezer 검색 결과를 ProfileMusicTrack 목록으로 반환한다', async () => {
      const result = await service.searchProfileMusic('Blinding Lights');
      expect(result.items).toHaveLength(1);
      expect(result.items[0].externalTrackId).toBe('12345');
      expect(result.items[0].sourceType).toBe('DEEZER');
    });

    it('Deezer API 실패 시 에러가 그대로 전파된다', async () => {
      jest.spyOn(deezerTrackClientStub, 'searchTracks').mockRejectedValueOnce(new Error('Deezer 장애'));
      await expect(service.searchProfileMusic('query')).rejects.toThrow('Deezer 장애');
    });
  });

  describe('deleteProfileMusic', () => {
    it('프로필 음악이 존재하면 삭제 결과를 반환한다', async () => {
      const result = await service.deleteProfileMusic('user-001');
      expect(result.userId).toBe('user-001');
      expect(result.deletedAt).toBeDefined();
    });

    it('프로필 음악이 없으면 NotFoundException을 던진다', async () => {
      await expect(service.deleteProfileMusic('unknown-id')).rejects.toThrow(NotFoundException);
    });

    it('tx가 전달되면 deleteByUserId에 동일한 tx를 전달한다', async () => {
      const txClient = {} as Prisma.TransactionClient;
      const deleteSpy = jest.spyOn(profileMusicRepositoryStub, 'deleteByUserId');

      await service.deleteProfileMusic('user-001', txClient);

      expect(deleteSpy).toHaveBeenCalledWith('user-001', txClient);
      deleteSpy.mockRestore();
    });
  });
});

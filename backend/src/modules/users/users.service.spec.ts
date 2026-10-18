import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { User } from 'src/generated/prisma';
import { Prisma } from 'src/generated/prisma';
import type { DeezerTrackClient } from 'src/modules/songs/deezer-track.client';
import type { DeezerTrackApiResponse } from 'src/modules/songs/types/deezer-track-api-response.type';

import type { GetUsersQuery } from './dto/get-users-query.dto';
import type { ProfileMusicRepository } from './repositoreis/profile-music.repository';
import type { UsersRepository } from './repositoreis/user.repository';
import type { CreateOAuthUserInput } from './types/oauth-user.type';
import type { DeleteProfileMusicResult, ProfileMusicTrack } from './types/profile-music.type';
import type { HandleState, UpdateHandleInput } from './types/user-handle.type';
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
  profile: { nickname: 'testuser', selfDescription: null, avatarUrl: null, profileMusic: null },
  skills: [],
  favoriteGenres: [],
};

const mockListResult: GetUsersResult = {
  items: [{ id: 'user-001', nickname: 'testuser', status: 'ACTIVE', avatarUrl: null, createdAt: '2026-01-01T00:00:00.000Z', skills: [] }],
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

// 접속 기록 호출을 관찰하기 위한 기록
const lastLoginCalls: { userId: string; now: Date; skipIfAfter: Date; tx: unknown }[] = [];

const repositoryStub: UsersRepository = {
  async findActiveSuspension(userId) {
    return userId === 'suspended-user' ? { endsAt: null } : null;
  },
  async updateLastLoginAt(userId, now, skipIfAfter, tx) {
    lastLoginCalls.push({ userId, now, skipIfAfter, tx });
  },
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
  async findUserByOAuth(_provider, providerUserId) {
    return providerUserId === 'google-sub-001' ? mockUser : null;
  },
  async findUserForOAuthLink(email) {
    return email === 'test@example.com' ? { id: 'user-001', email: 'test@example.com', deletedAt: null, status: 'ACTIVE' } : null;
  },
  async createOAuthAccount() {},
  async createUserWithOAuth(input) {
    return { ...mockUser, email: input.email } as User;
  },
  async findUserIdByHandle() {
    return null;
  },
  async findHandleState() {
    return null;
  },
  async updateHandle() {
    return true;
  },
};

// 고유 ID 시나리오별 반환값과 호출 인자를 바꿔 끼우는 stub
type HandleStubOptions = {
  state?: HandleState | null;
  owner?: { id: string } | null;
  updateResult?: boolean | Error;
};

type HandleStubCalls = {
  findUserIdByHandle: { handle: string; tx: unknown }[];
  findHandleState: { userId: string; tx: unknown }[];
  updateHandle: { userId: string; input: UpdateHandleInput; tx: unknown }[];
};

function createHandleRepositoryStub(options: HandleStubOptions): { stub: UsersRepository; calls: HandleStubCalls } {
  const calls: HandleStubCalls = { findUserIdByHandle: [], findHandleState: [], updateHandle: [] };
  const stub: UsersRepository = {
    ...repositoryStub,
    async findUserIdByHandle(handle, tx) {
      calls.findUserIdByHandle.push({ handle, tx });
      return options.owner ?? null;
    },
    async findHandleState(userId, tx) {
      calls.findHandleState.push({ userId, tx });
      return options.state === undefined ? { handle: null, handleChangedAt: null } : options.state;
    },
    async updateHandle(userId, input, tx) {
      calls.updateHandle.push({ userId, input, tx });
      if (options.updateResult instanceof Error) {
        throw options.updateResult;
      }
      return options.updateResult ?? true;
    },
  };
  return { stub, calls };
}

const oauthInput: CreateOAuthUserInput = {
  provider: 'GOOGLE',
  providerUserId: 'google-sub-001',
  email: 'new@example.com',
  nickname: '구글유저',
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

  describe('getActiveSuspension', () => {
    it('활성 정지가 있으면 정지 정보를 반환한다', async () => {
      await expect(service.getActiveSuspension('suspended-user')).resolves.toEqual({ endsAt: null });
    });

    it('활성 정지가 없으면 null을 반환한다', async () => {
      await expect(service.getActiveSuspension('user-001')).resolves.toBeNull();
    });
  });

  describe('recordLastLogin', () => {
    it('현재 시각으로 기록하고 10분 이내 갱신분은 건너뛰도록 기준 시각을 넘긴다', async () => {
      lastLoginCalls.length = 0;
      const tx = { transactionClient: true } as unknown as Prisma.TransactionClient;

      await service.recordLastLogin('user-001', tx);

      expect(lastLoginCalls).toHaveLength(1);
      const [call] = lastLoginCalls;
      expect(call.userId).toBe('user-001');
      expect(call.now.getTime() - call.skipIfAfter.getTime()).toBe(10 * 60 * 1000);
      expect(call.tx).toBe(tx);
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

  describe('getUserByOAuth', () => {
    it('연결된 유저를 반환한다', async () => {
      await expect(service.getUserByOAuth('GOOGLE', 'google-sub-001')).resolves.toEqual(mockUser);
    });

    it('연결이 없으면 null을 반환한다', async () => {
      await expect(service.getUserByOAuth('GOOGLE', 'unknown-sub')).resolves.toBeNull();
    });

    it('provider·providerUserId·tx를 repository에 그대로 전달한다', async () => {
      const findSpy = jest.spyOn(repositoryStub, 'findUserByOAuth');
      const tx = {} as Prisma.TransactionClient;

      await service.getUserByOAuth('GOOGLE', 'google-sub-001', tx);

      expect(findSpy).toHaveBeenCalledWith('GOOGLE', 'google-sub-001', tx);
      findSpy.mockRestore();
    });
  });

  describe('getUserForOAuthLink', () => {
    it('탈퇴 여부와 상태를 포함한 이메일 유저를 반환한다', async () => {
      await expect(service.getUserForOAuthLink('test@example.com')).resolves.toEqual({
        id: 'user-001',
        email: 'test@example.com',
        deletedAt: null,
        status: 'ACTIVE',
      });
    });

    it('이메일 유저가 없으면 null을 반환한다', async () => {
      await expect(service.getUserForOAuthLink('none@example.com')).resolves.toBeNull();
    });

    it('email과 tx를 repository에 그대로 전달한다', async () => {
      const findSpy = jest.spyOn(repositoryStub, 'findUserForOAuthLink');
      const tx = {} as Prisma.TransactionClient;

      await service.getUserForOAuthLink('test@example.com', tx);

      expect(findSpy).toHaveBeenCalledWith('test@example.com', tx);
      findSpy.mockRestore();
    });
  });

  describe('linkOAuthAccount', () => {
    it('repository에 연결 생성을 위임하고 인자와 tx를 그대로 전달한다', async () => {
      const createSpy = jest.spyOn(repositoryStub, 'createOAuthAccount');
      const tx = {} as Prisma.TransactionClient;

      await service.linkOAuthAccount('user-001', 'GOOGLE', 'google-sub-001', 'test@example.com', tx);

      expect(createSpy).toHaveBeenCalledWith('user-001', 'GOOGLE', 'google-sub-001', 'test@example.com', tx);
      createSpy.mockRestore();
    });

    it('연결 중 P2002가 발생하면 BadRequestException으로 변환한다', async () => {
      const conflict = new Prisma.PrismaClientKnownRequestError('unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      });
      const createSpy = jest.spyOn(repositoryStub, 'createOAuthAccount').mockRejectedValueOnce(conflict);

      await expect(service.linkOAuthAccount('user-001', 'GOOGLE', 'google-sub-001', 'test@example.com')).rejects.toThrow(BadRequestException);
      createSpy.mockRestore();
    });

    it('P2002 이외의 오류는 그대로 전파한다', async () => {
      const unexpected = new Error('db down');
      const createSpy = jest.spyOn(repositoryStub, 'createOAuthAccount').mockRejectedValueOnce(unexpected);

      await expect(service.linkOAuthAccount('user-001', 'GOOGLE', 'google-sub-001', 'test@example.com')).rejects.toThrow(unexpected);
      createSpy.mockRestore();
    });
  });

  describe('createUserWithGoogle', () => {
    it('생성된 유저를 반환한다', async () => {
      await expect(service.createUserWithGoogle(oauthInput)).resolves.toEqual({ ...mockUser, email: 'new@example.com' });
    });

    it('입력과 tx를 repository에 그대로 전달한다', async () => {
      const createSpy = jest.spyOn(repositoryStub, 'createUserWithOAuth');
      const tx = {} as Prisma.TransactionClient;

      await service.createUserWithGoogle(oauthInput, tx);

      expect(createSpy).toHaveBeenCalledWith(oauthInput, tx);
      createSpy.mockRestore();
    });

    it('생성 중 P2002가 발생하면 BadRequestException으로 변환한다', async () => {
      const conflict = new Prisma.PrismaClientKnownRequestError('unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      });
      const createSpy = jest.spyOn(repositoryStub, 'createUserWithOAuth').mockRejectedValueOnce(conflict);

      await expect(service.createUserWithGoogle(oauthInput)).rejects.toThrow(BadRequestException);
      createSpy.mockRestore();
    });

    it('P2002 이외의 오류는 그대로 전파한다', async () => {
      const unexpected = new Error('db down');
      const createSpy = jest.spyOn(repositoryStub, 'createUserWithOAuth').mockRejectedValueOnce(unexpected);

      await expect(service.createUserWithGoogle(oauthInput)).rejects.toThrow(unexpected);
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

    it('본인이 조회하면 email을 그대로 반환한다', async () => {
      const result = await service.getUserProfile('user-001', 'user-001');
      expect(result.user.email).toBe('test@example.com');
    });

    it('다른 사용자가 조회하면 email을 null로 가린다', async () => {
      const result = await service.getUserProfile('user-001', 'user-002');
      expect(result.user.email).toBeNull();
      expect(result.user.id).toBe('user-001');
      expect(mockProfile.user.email).toBe('test@example.com');
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

  describe('checkHandleAvailability', () => {
    function createService(options: HandleStubOptions) {
      const { stub, calls } = createHandleRepositoryStub(options);
      const handleService = new UsersService(stub, profileMusicRepositoryStub, deezerTrackClientStub as unknown as DeezerTrackClient);
      return { handleService, calls };
    }

    it('아무도 쓰지 않는 고유 ID면 사용 가능하다', async () => {
      const { handleService } = createService({ owner: null });

      await expect(handleService.checkHandleAvailability('devjun', 'user-001')).resolves.toEqual({ handle: 'devjun', available: true });
    });

    it('다른 유저가 쓰는 고유 ID면 사용할 수 없다', async () => {
      const { handleService } = createService({ owner: { id: 'user-002' } });

      await expect(handleService.checkHandleAvailability('devjun', 'user-001')).resolves.toEqual({ handle: 'devjun', available: false });
    });

    it('본인이 쓰는 고유 ID면 사용 가능하다', async () => {
      const { handleService } = createService({ owner: { id: 'user-001' } });

      await expect(handleService.checkHandleAvailability('DevJun', 'user-001')).resolves.toEqual({ handle: 'DevJun', available: true });
    });

    it('외부 tx를 repository에 그대로 전달한다', async () => {
      const { handleService, calls } = createService({ owner: null });
      const txClient = {} as Prisma.TransactionClient;

      await handleService.checkHandleAvailability('devjun', 'user-001', txClient);

      expect(calls.findUserIdByHandle).toEqual([{ handle: 'devjun', tx: txClient }]);
    });
  });

  describe('changeHandle', () => {
    const NOW = new Date('2026-10-19T06:00:00.000Z');
    const DAY_MS = 24 * 60 * 60 * 1000;
    const SEVEN_DAYS_LATER = new Date(NOW.getTime() + 7 * DAY_MS).toISOString();

    function createService(options: HandleStubOptions) {
      const { stub, calls } = createHandleRepositoryStub(options);
      const handleService = new UsersService(stub, profileMusicRepositoryStub, deezerTrackClientStub as unknown as DeezerTrackClient);
      return { handleService, calls };
    }

    beforeEach(() => {
      jest.useFakeTimers({ now: NOW });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('처음 설정하면 쿨다운 기준 시각을 기록하지 않아 바로 다시 바꿀 수 있다', async () => {
      const { handleService, calls } = createService({ state: { handle: null, handleChangedAt: null } });

      const result = await handleService.changeHandle('user-001', 'devjnu');

      expect(calls.updateHandle).toEqual([
        { userId: 'user-001', input: { currentHandle: null, newHandle: 'devjnu', changedAt: null }, tx: undefined },
      ]);
      expect(result).toEqual({ userId: 'user-001', handle: 'devjnu', handleChangedAt: null, handleChangeableAt: null });
    });

    it('처음 설정 직후 다시 바꾸면 쿨다운 없이 성공하고 그때부터 7일 제한이 걸린다', async () => {
      const { handleService, calls } = createService({ state: { handle: 'devjnu', handleChangedAt: null } });

      const result = await handleService.changeHandle('user-001', 'devjun');

      expect(calls.updateHandle[0].input).toEqual({ currentHandle: 'devjnu', newHandle: 'devjun', changedAt: NOW });
      expect(result).toEqual({ userId: 'user-001', handle: 'devjun', handleChangedAt: NOW.toISOString(), handleChangeableAt: SEVEN_DAYS_LATER });
    });

    it('바꾼 지 정확히 7일이 지났으면 다시 바꿀 수 있다', async () => {
      const changedAt = new Date(NOW.getTime() - 7 * DAY_MS);
      const { handleService } = createService({ state: { handle: 'devjun', handleChangedAt: changedAt } });

      await expect(handleService.changeHandle('user-001', 'junny')).resolves.toMatchObject({ handle: 'junny', handleChangedAt: NOW.toISOString() });
    });

    it('바꾼 지 7일이 안 됐으면 BadRequestException을 던지고 저장하지 않는다', async () => {
      const changedAt = new Date(NOW.getTime() - DAY_MS);
      const { handleService, calls } = createService({ state: { handle: 'devjun', handleChangedAt: changedAt } });

      await expect(handleService.changeHandle('user-001', 'junny')).rejects.toThrow(
        new BadRequestException('고유 ID는 7일에 한 번만 변경할 수 있습니다.'),
      );
      expect(calls.findUserIdByHandle).toEqual([]);
      expect(calls.updateHandle).toEqual([]);
    });

    it('지금 값과 똑같으면 저장하지 않고 현재 쿨다운 상태를 그대로 돌려준다', async () => {
      const changedAt = new Date(NOW.getTime() - DAY_MS);
      const { handleService, calls } = createService({ state: { handle: 'devjun', handleChangedAt: changedAt } });

      const result = await handleService.changeHandle('user-001', 'devjun');

      expect(calls.updateHandle).toEqual([]);
      expect(result).toEqual({
        userId: 'user-001',
        handle: 'devjun',
        handleChangedAt: changedAt.toISOString(),
        handleChangeableAt: new Date(changedAt.getTime() + 7 * DAY_MS).toISOString(),
      });
    });

    it('탈퇴했거나 없는 유저면 NotFoundException을 던진다', async () => {
      const { handleService } = createService({ state: null });

      await expect(handleService.changeHandle('unknown-id', 'devjun')).rejects.toThrow(NotFoundException);
    });

    it('다른 유저가 대소문자만 다른 값을 쓰고 있으면 BadRequestException을 던진다', async () => {
      const { handleService, calls } = createService({ state: { handle: null, handleChangedAt: null }, owner: { id: 'user-002' } });

      await expect(handleService.changeHandle('user-001', 'DevJun')).rejects.toThrow(new BadRequestException('이미 사용 중인 고유 ID입니다.'));
      expect(calls.updateHandle).toEqual([]);
    });

    it('본인 값을 대소문자만 바꾸는 것은 변경으로 처리한다', async () => {
      const { handleService, calls } = createService({ state: { handle: 'devjun', handleChangedAt: null }, owner: { id: 'user-001' } });

      await expect(handleService.changeHandle('user-001', 'DevJun')).resolves.toMatchObject({ handle: 'DevJun' });
      expect(calls.updateHandle).toHaveLength(1);
    });

    it('저장 중 P2002가 나면 이미 사용 중인 고유 ID로 BadRequestException을 던진다', async () => {
      const p2002 = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '0' });
      const { handleService } = createService({ updateResult: p2002 });

      await expect(handleService.changeHandle('user-001', 'devjun')).rejects.toThrow(new BadRequestException('이미 사용 중인 고유 ID입니다.'));
    });

    it('P2002 이외의 저장 오류는 그대로 전파한다', async () => {
      const { handleService } = createService({ updateResult: new Error('db connection error') });

      await expect(handleService.changeHandle('user-001', 'devjun')).rejects.toThrow('db connection error');
    });

    it('다른 요청이 먼저 바꿔 저장되지 않으면 BadRequestException을 던진다', async () => {
      const { handleService } = createService({ updateResult: false });

      await expect(handleService.changeHandle('user-001', 'devjun')).rejects.toThrow(BadRequestException);
    });

    it('외부 tx를 모든 repository 호출에 그대로 전달한다', async () => {
      const { handleService, calls } = createService({ state: { handle: null, handleChangedAt: null } });
      const txClient = {} as Prisma.TransactionClient;

      await handleService.changeHandle('user-001', 'devjun', txClient);

      expect(calls.findHandleState[0].tx).toBe(txClient);
      expect(calls.findUserIdByHandle[0].tx).toBe(txClient);
      expect(calls.updateHandle[0].tx).toBe(txClient);
    });
  });
});

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { Prisma } from 'src/generated/prisma';

import type { GetUsersQuery } from '../dto/get-users-query.dto';

import { UsersPrismaRepository } from './user.prisma-repository';

const mockPrisma = {
  user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  userSanction: { findFirst: jest.fn() },
  userProfile: { create: jest.fn(), update: jest.fn(), findFirst: jest.fn(), updateMany: jest.fn() },
  profileMusic: { findUnique: jest.fn(), upsert: jest.fn(), delete: jest.fn() },
  userSkill: { deleteMany: jest.fn(), createMany: jest.fn() },
  favoriteGenre: { deleteMany: jest.fn(), createMany: jest.fn() },
  userOAuthAccount: { findUnique: jest.fn(), create: jest.fn() },
  $transaction: jest.fn().mockImplementation(fn => fn(mockPrisma)),
};

// 시각과 무관하게 비교하려고 endsAt 조건은 아무 Date나 허용한다
const ACTIVE_SUSPENSION_WHERE = {
  type: 'SUSPENSION',
  revokedAt: null,
  OR: [{ endsAt: null }, { endsAt: { gt: expect.any(Date) } }],
};

const defaultQuery: GetUsersQuery = { order__created_at: 'desc', order__id: 'desc', take: 20 };

const userRecord = {
  id: 'user-001',
  email: 'test@example.com',
  status: 'ACTIVE',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  profile: { nickname: 'testuser', handle: 'devjun', handleChangedAt: null, selfDescription: '안녕', avatarUrl: null },
  profileMusic: null,
  userSkills: [{ skillTypeId: 'skill-001', skillLevel: 'ADVANCED', isPrimary: true, skillType: { name: 'GUITAR' } }],
  favoriteGenres: [{ genreId: 'genre-001', genre: { name: 'ROCK' } }],
};

describe('UsersPrismaRepository', () => {
  let repository: UsersPrismaRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersPrismaRepository, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    repository = module.get(UsersPrismaRepository);
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(fn => fn(mockPrisma));
  });

  describe('findByEmail', () => {
    it('이메일로 user.findUnique를 호출한다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userRecord);
      const result = await repository.findByEmail('test@example.com');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true, email: true },
      });
      expect(result?.id).toBe('user-001');
    });

    it('존재하지 않으면 null을 반환한다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      expect(await repository.findByEmail('none@example.com')).toBeNull();
    });

    it('tx가 전달되면 tx 클라이언트를 사용한다', async () => {
      const txClient = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
      await repository.findByEmail('test@example.com', txClient as unknown as Prisma.TransactionClient);
      expect(txClient.user.findUnique).toHaveBeenCalled();
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('findUserByOAuth', () => {
    it('provider와 providerUserId 복합 키로 연결된 활성 유저를 반환한다', async () => {
      mockPrisma.userOAuthAccount.findUnique.mockResolvedValue({
        user: { id: 'user-001', email: 'test@example.com', deletedAt: null, status: 'ACTIVE' },
      });

      const result = await repository.findUserByOAuth('GOOGLE', 'google-sub-001');

      expect(mockPrisma.userOAuthAccount.findUnique).toHaveBeenCalledWith({
        where: { provider_providerUserId: { provider: 'GOOGLE', providerUserId: 'google-sub-001' } },
        select: { user: { select: { id: true, email: true, deletedAt: true, status: true } } },
      });
      expect(result).toEqual({ id: 'user-001', email: 'test@example.com' });
    });

    it('연결이 없으면 null을 반환한다', async () => {
      mockPrisma.userOAuthAccount.findUnique.mockResolvedValue(null);
      expect(await repository.findUserByOAuth('GOOGLE', 'unknown-sub')).toBeNull();
    });

    it('연결된 유저가 탈퇴 상태면 null을 반환한다', async () => {
      mockPrisma.userOAuthAccount.findUnique.mockResolvedValue({
        user: { id: 'user-001', email: 'test@example.com', deletedAt: new Date(), status: 'INACTIVE' },
      });
      expect(await repository.findUserByOAuth('GOOGLE', 'google-sub-001')).toBeNull();
    });
  });

  describe('findUserForOAuthLink', () => {
    it('탈퇴 여부와 무관하게 이메일 유저를 deletedAt·status와 함께 반환한다', async () => {
      const deletedAt = new Date('2026-08-01T00:00:00.000Z');
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-001', email: 'test@example.com', deletedAt, status: 'INACTIVE' });

      const result = await repository.findUserForOAuthLink('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true, email: true, deletedAt: true, status: true },
      });
      expect(result).toEqual({ id: 'user-001', email: 'test@example.com', deletedAt, status: 'INACTIVE' });
    });

    it('존재하지 않으면 null을 반환한다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      expect(await repository.findUserForOAuthLink('none@example.com')).toBeNull();
    });
  });

  describe('createUserWithOAuth', () => {
    it('유저·프로필·OAuth 계정을 같은 transaction에서 생성한다', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 'user-002', email: 'new@example.com' });

      const result = await repository.createUserWithOAuth({
        provider: 'GOOGLE',
        providerUserId: 'google-sub-002',
        email: 'new@example.com',
        nickname: '구글유저',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: { email: 'new@example.com' } });
      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith({ data: { userId: 'user-002', nickname: '구글유저' } });
      expect(mockPrisma.userOAuthAccount.create).toHaveBeenCalledWith({
        data: { userId: 'user-002', provider: 'GOOGLE', providerUserId: 'google-sub-002', email: 'new@example.com' },
      });
      expect(result).toEqual({ id: 'user-002', email: 'new@example.com' });
    });

    it('외부 tx가 전달되면 새 transaction을 열지 않는다', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 'user-002', email: 'new@example.com' });

      await repository.createUserWithOAuth(
        { provider: 'GOOGLE', providerUserId: 'google-sub-002', email: 'new@example.com', nickname: '구글유저' },
        mockPrisma as unknown as Prisma.TransactionClient,
      );

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findAuthUserById', () => {
    it('ACTIVE 상태이고 삭제되지 않은 유저를 id/email만 조회한다', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(userRecord);
      const result = await repository.findAuthUserById('user-001');
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-001', deletedAt: null, status: 'ACTIVE', sanctions: { none: ACTIVE_SUSPENSION_WHERE } },
        select: { id: true, email: true },
      });
      expect(result).toEqual({ id: 'user-001', email: 'test@example.com' });
    });

    it('email이 없으면 null을 반환한다', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-001', email: null });
      await expect(repository.findAuthUserById('user-001')).resolves.toBeNull();
    });

    it('tx가 전달되면 tx 클라이언트로 findFirst를 호출한다', async () => {
      const txClient = { user: { findFirst: jest.fn().mockResolvedValue(userRecord) } };
      const result = await repository.findAuthUserById('user-001', txClient as unknown as Prisma.TransactionClient);
      expect(txClient.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-001', deletedAt: null, status: 'ACTIVE', sanctions: { none: ACTIVE_SUSPENSION_WHERE } },
        select: { id: true, email: true },
      });
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'user-001', email: 'test@example.com' });
    });
  });

  describe('findActiveSuspension', () => {
    it('활성 정지 중 영구 정지를 먼저, 그다음 늦게 끝나는 정지를 고른다', async () => {
      const now = new Date('2026-10-05T00:00:00.000Z');
      mockPrisma.userSanction.findFirst.mockResolvedValue({ endsAt: null });

      const result = await repository.findActiveSuspension('user-001', now);

      expect(mockPrisma.userSanction.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-001', type: 'SUSPENSION', revokedAt: null, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
        orderBy: [{ endsAt: { sort: 'desc', nulls: 'first' } }],
        select: { endsAt: true },
      });
      expect(result).toEqual({ endsAt: null });
    });
  });

  describe('updateLastLoginAt', () => {
    it('기록이 없거나 기준 시각보다 오래된 경우에만 갱신한다', async () => {
      const now = new Date('2026-10-05T00:10:00.000Z');
      const skipIfAfter = new Date('2026-10-05T00:00:00.000Z');
      mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });

      await repository.updateLastLoginAt('user-001', now, skipIfAfter);

      expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: 'user-001', OR: [{ lastLoginAt: null }, { lastLoginAt: { lt: skipIfAfter } }] },
        data: { lastLoginAt: now },
      });
    });
  });

  describe('findUserForPasswordAuth', () => {
    it('로그인에 필요한 passwordHash까지만 조회한다', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-001', email: 'test@example.com', passwordHash: 'hash' });
      const result = await repository.findUserForPasswordAuth('test@example.com');
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null, status: 'ACTIVE' },
        select: { id: true, email: true, passwordHash: true },
      });
      expect(result).toEqual({ id: 'user-001', email: 'test@example.com', passwordHash: 'hash' });
    });

    it('email이 없으면 null을 반환한다', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-001', email: null, passwordHash: 'hash' });
      await expect(repository.findUserForPasswordAuth('test@example.com')).resolves.toBeNull();
    });

    it('tx가 전달되면 tx 클라이언트로 findFirst를 호출한다', async () => {
      const txClient = {
        user: { findFirst: jest.fn().mockResolvedValue({ id: 'user-001', email: 'test@example.com', passwordHash: 'hash' }) },
      };
      const result = await repository.findUserForPasswordAuth('test@example.com', txClient as unknown as Prisma.TransactionClient);
      expect(txClient.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com', deletedAt: null, status: 'ACTIVE' },
        select: { id: true, email: true, passwordHash: true },
      });
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'user-001', email: 'test@example.com', passwordHash: 'hash' });
    });
  });

  describe('createUserWithEmail', () => {
    it('tx 없이 호출하면 $transaction 안에서 user와 userProfile을 생성한다', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 'new-uid', email: 'new@example.com' });
      mockPrisma.userProfile.create.mockResolvedValue({});

      const result = await repository.createUserWithEmail('new@example.com', 'hashed', '홍길동');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data: { email: 'new@example.com', passwordHash: 'hashed' } });
      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'new-uid' }) }));
      expect(result.email).toBe('new@example.com');
    });

    it('tx가 전달되면 $transaction을 사용하지 않는다', async () => {
      const txClient = {
        user: { create: jest.fn().mockResolvedValue({ id: 'tx-uid', email: 'tx@example.com' }) },
        userProfile: { create: jest.fn().mockResolvedValue({}) },
      };

      await repository.createUserWithEmail('tx@example.com', 'hashed', '홍길동', txClient as unknown as Prisma.TransactionClient);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(txClient.user.create).toHaveBeenCalled();
    });

    it('nickname을 프로필 닉네임으로 저장한다', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 'new-uid', email: 'new@example.com' });
      mockPrisma.userProfile.create.mockResolvedValue({});

      await repository.createUserWithEmail('new@example.com', 'hashed', '홍길동');

      expect(mockPrisma.userProfile.create).toHaveBeenCalledWith({ data: { userId: 'new-uid', nickname: '홍길동' } });
    });
  });

  describe('findUsers', () => {
    const listRecord = {
      id: 'user-001',
      email: 'test@example.com',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      profile: { nickname: 'testuser', handle: 'devjun', avatarUrl: null },
      userSkills: [],
    };

    it('목록 항목에 고유 ID를 담고, 정하지 않은 유저는 null이다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        listRecord,
        { ...listRecord, id: 'user-002', profile: { nickname: 'other', handle: null, avatarUrl: null } },
      ]);

      const result = await repository.findUsers(defaultQuery);

      expect(result.items.map(item => item.handle)).toEqual(['devjun', null]);
    });

    it('where__keyword__contain이 있으면 닉네임·고유 ID 부분 일치와 이메일 완전 일치를 OR로 묶는다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await repository.findUsers({ ...defaultQuery, where__keyword__contain: 'devjun' });

      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.where).toEqual({
        deletedAt: null,
        OR: [
          { profile: { nickname: { contains: 'devjun', mode: 'insensitive' } } },
          { profile: { handle: { contains: 'devjun', mode: 'insensitive' } } },
          { email: { equals: 'devjun', mode: 'insensitive' } },
        ],
      });
    });

    it('where__keyword__contain과 where__nickname__contain이 함께 오면 두 조건을 모두 만족해야 한다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await repository.findUsers({ ...defaultQuery, where__nickname__contain: 'nick', where__keyword__contain: 'devjun' });

      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.where.profile).toEqual({ nickname: { contains: 'nick', mode: 'insensitive' } });
      expect(callArgs.where.OR).toHaveLength(3);
      expect(callArgs.where).not.toHaveProperty('keyword');
    });

    it('where__keyword__contain과 커서가 함께 오면 커서 조건은 AND, 검색 조건은 OR로 공존한다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await repository.findUsers({
        ...defaultQuery,
        where__keyword__contain: 'devjun',
        cursor__id: 'cursor-uuid',
        cursor__created_at: '2026-01-01T00:00:00.000Z',
      });

      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.where.AND[0].OR).toHaveLength(2);
      expect(callArgs.where.OR).toHaveLength(3);
    });

    it('다음 페이지 URL에 where__keyword__contain을 이어 붙인다', async () => {
      const second = { ...listRecord, id: 'user-002', createdAt: new Date('2025-12-01T00:00:00.000Z') };
      mockPrisma.user.findMany.mockResolvedValue([listRecord, second]);

      const result = await repository.findUsers({ ...defaultQuery, take: 2, where__keyword__contain: 'devjun' });

      expect(result.meta.next).toContain('where__keyword__contain=devjun');
    });

    it('유저에게 세션이 있을 때, 목록 항목은 세션 이름과 대표 여부를 함께 담아야 한다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          ...listRecord,
          userSkills: [
            { skillTypeId: 'skill-1', skillLevel: 'ADVANCED', isPrimary: true, skillType: { name: '보컬' } },
            { skillTypeId: 'skill-2', skillLevel: 'BEGINNER', isPrimary: false, skillType: { name: '드럼' } },
          ],
        },
      ]);

      const result = await repository.findUsers(defaultQuery);

      expect(result.items[0].skills).toEqual([
        { skillTypeId: 'skill-1', skillName: '보컬', skillLevel: 'ADVANCED', isPrimary: true },
        { skillTypeId: 'skill-2', skillName: '드럼', skillLevel: 'BEGINNER', isPrimary: false },
      ]);
    });

    it('세션이 없는 유저일 때, 목록 항목의 skills는 빈 배열이어야 한다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([listRecord]);

      const result = await repository.findUsers(defaultQuery);

      expect(result.items[0].skills).toEqual([]);
    });

    it('기본 where에는 deletedAt: null만 포함된다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repository.findUsers(defaultQuery);
      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.where).toEqual({ deletedAt: null });
    });

    it('where__nickname__contain이 있으면 profile.nickname contains 조건이 추가된다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repository.findUsers({ ...defaultQuery, where__nickname__contain: 'nick' });
      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.where.profile).toEqual({ nickname: { contains: 'nick', mode: 'insensitive' } });
    });

    it('cursor__id와 cursor__created_at이 있으면 keyset WHERE 조건이 추가된다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repository.findUsers({ ...defaultQuery, cursor__id: 'cursor-uuid', cursor__created_at: '2026-01-01T00:00:00.000Z' });
      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.cursor).toBeUndefined();
      expect(callArgs.skip).toBeUndefined();
      expect(callArgs.where.AND).toBeDefined();
      expect(callArgs.where.AND[0].OR).toHaveLength(2);
    });

    it('cursor가 없으면 AND 조건이 추가되지 않는다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repository.findUsers(defaultQuery);
      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.cursor).toBeUndefined();
      expect(callArgs.skip).toBeUndefined();
      expect(callArgs.where.AND).toBeUndefined();
    });

    it('결과가 없으면 cursor와 next가 모두 null이다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      const result = await repository.findUsers(defaultQuery);
      expect(result.meta.cursor).toBeNull();
      expect(result.meta.next).toBeNull();
    });

    it('결과가 take보다 적으면 next가 null이다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([listRecord]);
      const result = await repository.findUsers({ ...defaultQuery, take: 20 });
      expect(result.meta.cursor?.id).toBe('user-001');
      expect(result.meta.next).toBeNull();
    });

    it('결과가 take와 같으면 next에 다음 페이지 URL이 설정된다', async () => {
      const second = { ...listRecord, id: 'user-002', createdAt: new Date('2025-12-01T00:00:00.000Z') };
      mockPrisma.user.findMany.mockResolvedValue([listRecord, second]);
      const result = await repository.findUsers({ ...defaultQuery, take: 2 });
      expect(typeof result.meta.next).toBe('string');
      expect(result.meta.next).toContain('cursor__id=user-002');
      expect(result.meta.next).toContain('cursor__created_at=');
    });
  });

  describe('softDeleteUser', () => {
    it('deletedAt과 status를 업데이트하고 고유 ID를 풀어 결과를 반환한다', async () => {
      const now = new Date();
      mockPrisma.user.update.mockResolvedValue({ id: 'user-001', deletedAt: now });
      const result = await repository.softDeleteUser('user-001');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-001', deletedAt: null },
        data: { deletedAt: expect.any(Date), status: 'INACTIVE', profile: { update: { handle: null, handleChangedAt: null } } },
        select: { id: true, deletedAt: true },
      });
      expect(result?.userId).toBe('user-001');
      expect(result?.deletedAt).toBe(now.toISOString());
    });

    it('tx가 전달되면 tx 클라이언트를 사용한다', async () => {
      const now = new Date();
      const txClient = { user: { update: jest.fn().mockResolvedValue({ id: 'user-001', deletedAt: now }) } };
      await repository.softDeleteUser('user-001', txClient as unknown as Prisma.TransactionClient);
      expect(txClient.user.update).toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('존재하지 않거나 이미 삭제된 유저면 null을 반환한다 (P2025)', async () => {
      const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: '0' });
      mockPrisma.user.update.mockRejectedValue(p2025);
      const result = await repository.softDeleteUser('unknown-id');
      expect(result).toBeNull();
    });

    it('P2025 외 에러는 그대로 전파한다', async () => {
      mockPrisma.user.update.mockRejectedValue(new Error('db connection error'));
      await expect(repository.softDeleteUser('user-001')).rejects.toThrow('db connection error');
    });
  });

  describe('findUserProfileById', () => {
    it('유저가 없으면 null을 반환한다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      expect(await repository.findUserProfileById('unknown')).toBeNull();
    });

    it('유저가 있으면 올바른 형태로 매핑한다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userRecord);
      const result = await repository.findUserProfileById('user-001');
      expect(result?.user.id).toBe('user-001');
      expect(result?.user.createdAt).toBe('2026-01-01T00:00:00.000Z');
      expect(result?.profile?.nickname).toBe('testuser');
      expect(result?.profile?.handle).toBe('devjun');
      expect(result?.profile?.handleChangedAt).toBeNull();
      expect(result?.profile?.profileMusic).toBeNull();
      expect(result).not.toHaveProperty('profileMusic');
      expect(result?.skills[0]).toEqual({ skillTypeId: 'skill-001', skillName: 'GUITAR', level: 'ADVANCED', isPrimary: true });
      expect(result?.favoriteGenres[0]).toEqual({ genreId: 'genre-001', name: 'ROCK' });
    });

    it('프로필 음악이 있으면 profile.profileMusic으로 매핑한다', async () => {
      const trackData = { externalTrackId: '12345', sourceType: 'DEEZER', title: 'Blinding Lights' };
      mockPrisma.user.findUnique.mockResolvedValue({ ...userRecord, profileMusic: { trackData } });
      const result = await repository.findUserProfileById('user-001');
      expect(result?.profile?.profileMusic).toEqual(trackData);
    });

    it('profile이 없으면 profile 필드가 null이다', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...userRecord, profile: null });
      const result = await repository.findUserProfileById('user-001');
      expect(result?.profile).toBeNull();
    });
  });

  describe('updateUserProfile', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue(userRecord);
      mockPrisma.userProfile.update.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.userSkill.deleteMany.mockResolvedValue({});
      mockPrisma.userSkill.createMany.mockResolvedValue({});
      mockPrisma.favoriteGenre.deleteMany.mockResolvedValue({});
      mockPrisma.favoriteGenre.createMany.mockResolvedValue({});
    });

    it('profile이 있으면 userProfile.update를 호출한다', async () => {
      await repository.updateUserProfile('user-001', { profile: { nickname: '새닉네임' } });
      expect(mockPrisma.userProfile.update).toHaveBeenCalledWith({ where: { userId: 'user-001' }, data: { nickname: '새닉네임' } });
    });

    it('personalInfo.email이 있으면 user.update를 호출한다', async () => {
      await repository.updateUserProfile('user-001', { personalInfo: { email: 'new@example.com' } });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'user-001' }, data: { email: 'new@example.com' } });
    });

    it('skills가 있으면 기존 스킬을 삭제하고 새로 생성한다', async () => {
      await repository.updateUserProfile('user-001', { skills: [{ skillTypeId: 'skill-002', level: 'INTERMEDIATE', isPrimary: false }] });
      expect(mockPrisma.userSkill.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-001' } });
      expect(mockPrisma.userSkill.createMany).toHaveBeenCalledWith({
        data: [{ userId: 'user-001', skillTypeId: 'skill-002', skillLevel: 'INTERMEDIATE', isPrimary: false }],
      });
    });

    it('favoriteGenres가 있으면 기존 장르를 삭제하고 새로 생성한다', async () => {
      await repository.updateUserProfile('user-001', { favoriteGenres: ['genre-002'] });
      expect(mockPrisma.favoriteGenre.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-001' } });
      expect(mockPrisma.favoriteGenre.createMany).toHaveBeenCalledWith({ data: [{ userId: 'user-001', genreId: 'genre-002' }] });
    });

    it('favoriteGenre.createMany가 P2003을 던지면 BadRequestException으로 변환한다', async () => {
      const p2003 = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', { code: 'P2003', clientVersion: '0' });
      mockPrisma.favoriteGenre.createMany.mockRejectedValue(p2003);
      await expect(repository.updateUserProfile('user-001', { favoriteGenres: ['unknown-genre'] })).rejects.toBeInstanceOf(BadRequestException);
    });

    it('userSkill.createMany가 P2003을 던지면 BadRequestException으로 변환한다', async () => {
      const p2003 = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', { code: 'P2003', clientVersion: '0' });
      mockPrisma.userSkill.createMany.mockRejectedValue(p2003);
      await expect(
        repository.updateUserProfile('user-001', { skills: [{ skillTypeId: 'unknown-skill', level: 'BEGINNER', isPrimary: true }] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('favoriteGenre.createMany의 P2003 이외 오류는 그대로 전파한다', async () => {
      mockPrisma.favoriteGenre.createMany.mockRejectedValue(new Error('db down'));
      await expect(repository.updateUserProfile('user-001', { favoriteGenres: ['genre-002'] })).rejects.toThrow('db down');
    });

    it('profile.profileMusic이 있으면 create/update trackData 페이로드를 포함해 profileMusic.upsert를 호출한다', async () => {
      mockPrisma.profileMusic.upsert.mockResolvedValue({});
      const trackData = {
        externalTrackId: '12345',
        sourceType: 'DEEZER' as const,
        title: 'Blinding Lights',
        artistName: 'The Weeknd',
        albumName: 'After Hours',
        albumImageUrl: null,
        durationMs: 200000,
        previewUrl: null,
        sourceUrl: 'https://www.deezer.com/track/12345',
      };
      await repository.updateUserProfile('user-001', { profile: { profileMusic: trackData } });
      expect(mockPrisma.profileMusic.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-001' },
        create: { userId: 'user-001', trackData },
        update: { trackData },
      });
    });

    it('profile.profileMusic이 null이면 profileMusic.upsert를 호출하지 않는다', async () => {
      await repository.updateUserProfile('user-001', { profile: { profileMusic: null } });
      expect(mockPrisma.profileMusic.upsert).not.toHaveBeenCalled();
    });

    it('profile.profileMusic이 없으면 profileMusic.upsert를 호출하지 않는다', async () => {
      await repository.updateUserProfile('user-001', { profile: { nickname: '새닉네임' } });
      expect(mockPrisma.profileMusic.upsert).not.toHaveBeenCalled();
    });

    it('profileMusic.upsert가 P2003을 던지면 NotFoundException으로 변환한다', async () => {
      const p2003 = new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', { code: 'P2003', clientVersion: '0' });
      mockPrisma.profileMusic.upsert.mockRejectedValue(p2003);
      const trackData = {
        externalTrackId: '12345',
        sourceType: 'DEEZER' as const,
        title: 'Blinding Lights',
        artistName: 'The Weeknd',
        albumName: 'After Hours',
        albumImageUrl: null,
        durationMs: 200000,
        previewUrl: null,
        sourceUrl: 'https://www.deezer.com/track/12345',
      };
      await expect(repository.updateUserProfile('user-001', { profile: { profileMusic: trackData } })).rejects.toBeInstanceOf(NotFoundException);
    });

    it('tx가 전달되면 tx 클라이언트로 profileMusic.upsert를 호출한다', async () => {
      const txClient = {
        userProfile: { update: jest.fn().mockResolvedValue({}) },
        profileMusic: { upsert: jest.fn().mockResolvedValue({}) },
        user: { findUnique: jest.fn().mockResolvedValue(userRecord) },
      };
      const trackData = {
        externalTrackId: '999',
        sourceType: 'DEEZER' as const,
        title: 'Test',
        artistName: 'Artist',
        albumName: 'Album',
        albumImageUrl: null,
        durationMs: 100000,
        previewUrl: null,
        sourceUrl: 'https://www.deezer.com/track/999',
      };
      await repository.updateUserProfile('user-001', { profile: { profileMusic: trackData } }, txClient as unknown as Prisma.TransactionClient);
      expect(txClient.profileMusic.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-001' },
        create: { userId: 'user-001', trackData },
        update: { trackData },
      });
      expect(mockPrisma.profileMusic.upsert).not.toHaveBeenCalled();
    });

    it('모든 변경 후 최신 프로필을 반환한다', async () => {
      const result = await repository.updateUserProfile('user-001', { profile: { nickname: '새닉네임' } });
      expect(result.user.id).toBe('user-001');
      expect(result.profile?.nickname).toBe('testuser');
    });
  });

  describe('findUserIdByHandle', () => {
    it('대소문자를 무시하고 같은 고유 ID를 가진 유저 id를 돌려준다', async () => {
      mockPrisma.userProfile.findFirst.mockResolvedValue({ userId: 'user-002' });

      const result = await repository.findUserIdByHandle('DevJun');

      expect(mockPrisma.userProfile.findFirst).toHaveBeenCalledWith({
        where: { handle: { equals: 'DevJun', mode: 'insensitive' } },
        select: { userId: true },
      });
      expect(result).toEqual({ id: 'user-002' });
    });

    it('쓰는 유저가 없으면 null을 돌려준다', async () => {
      mockPrisma.userProfile.findFirst.mockResolvedValue(null);

      expect(await repository.findUserIdByHandle('devjun')).toBeNull();
    });
  });

  describe('findHandleState', () => {
    it('탈퇴하지 않은 유저의 고유 ID와 쿨다운 기준 시각만 조회한다', async () => {
      const changedAt = new Date('2026-10-19T06:00:00.000Z');
      mockPrisma.userProfile.findFirst.mockResolvedValue({ handle: 'devjun', handleChangedAt: changedAt });

      const result = await repository.findHandleState('user-001');

      expect(mockPrisma.userProfile.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-001', user: { deletedAt: null } },
        select: { handle: true, handleChangedAt: true },
      });
      expect(result).toEqual({ handle: 'devjun', handleChangedAt: changedAt });
    });
  });

  describe('updateHandle', () => {
    const input = { currentHandle: 'devjnu', newHandle: 'devjun', changedAt: new Date('2026-10-19T06:00:00.000Z') };

    it('현재 고유 ID가 읽은 값과 같을 때만 저장한다', async () => {
      mockPrisma.userProfile.updateMany.mockResolvedValue({ count: 1 });

      const result = await repository.updateHandle('user-001', input);

      expect(mockPrisma.userProfile.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-001', handle: 'devjnu', user: { deletedAt: null } },
        data: { handle: 'devjun', handleChangedAt: input.changedAt },
      });
      expect(result).toBe(true);
    });

    it('다른 요청이 먼저 바꿔 갱신된 행이 없으면 false를 돌려준다', async () => {
      mockPrisma.userProfile.updateMany.mockResolvedValue({ count: 0 });

      expect(await repository.updateHandle('user-001', input)).toBe(false);
    });

    it('tx가 전달되면 tx 클라이언트를 사용한다', async () => {
      const txClient = { userProfile: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) } };

      await repository.updateHandle('user-001', input, txClient as unknown as Prisma.TransactionClient);

      expect(txClient.userProfile.updateMany).toHaveBeenCalled();
      expect(mockPrisma.userProfile.updateMany).not.toHaveBeenCalled();
    });
  });
});

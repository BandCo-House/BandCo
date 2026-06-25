import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/database/prisma/prisma.service';
import type { Prisma } from 'src/generated/prisma';

import type { GetUsersQuery } from '../dto/get-users-query.dto';

import { UsersPrismaRepository } from './user.prisma-repository';

const mockPrisma = {
  user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  userProfile: { create: jest.fn(), update: jest.fn() },
  userSkill: { deleteMany: jest.fn(), createMany: jest.fn() },
  favoriteGenre: { deleteMany: jest.fn(), createMany: jest.fn() },
  $transaction: jest.fn().mockImplementation(fn => fn(mockPrisma)),
};

const defaultQuery: GetUsersQuery = { order__created_at: 'desc', order__id: 'desc', take: 20 };

const userRecord = {
  id: 'user-001',
  email: 'test@example.com',
  status: 'ACTIVE',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  profile: { nickname: 'testuser', selfDescription: '안녕', profileMusicUrl: null, avatarUrl: null },
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

  describe('findAuthUserById', () => {
    it('ACTIVE 상태이고 삭제되지 않은 유저를 id/email만 조회한다', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(userRecord);
      const result = await repository.findAuthUserById('user-001');
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { id: 'user-001', deletedAt: null, status: 'ACTIVE' },
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
        where: { id: 'user-001', deletedAt: null, status: 'ACTIVE' },
        select: { id: true, email: true },
      });
      expect(mockPrisma.user.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'user-001', email: 'test@example.com' });
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

      const result = await repository.createUserWithEmail('new@example.com', 'hashed');

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

      await repository.createUserWithEmail('tx@example.com', 'hashed', txClient as unknown as Prisma.TransactionClient);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(txClient.user.create).toHaveBeenCalled();
    });
  });

  describe('findUsers', () => {
    const listRecord = {
      id: 'user-001',
      email: 'test@example.com',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      profile: { nickname: 'testuser', avatarUrl: null },
    };

    it('기본 where에는 deletedAt: null만 포함된다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repository.findUsers(defaultQuery);
      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.where).toEqual({ deletedAt: null });
    });

    it('where__email__contain이 있으면 email contains 조건이 추가된다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repository.findUsers({ ...defaultQuery, where__email__contain: 'test' });
      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.where.email).toEqual({ contains: 'test', mode: 'insensitive' });
    });

    it('where__nickname__contain이 있으면 profile.nickname contains 조건이 추가된다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repository.findUsers({ ...defaultQuery, where__nickname__contain: 'nick' });
      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.where.profile).toEqual({ nickname: { contains: 'nick', mode: 'insensitive' } });
    });

    it('cursor__id가 있으면 cursor와 skip:1이 전달된다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repository.findUsers({ ...defaultQuery, cursor__id: 'cursor-uuid', cursor__created_at: '2026-01-01T00:00:00.000Z' });
      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.cursor).toEqual({ id: 'cursor-uuid' });
      expect(callArgs.skip).toBe(1);
    });

    it('cursor__id가 없으면 cursor와 skip이 전달되지 않는다', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await repository.findUsers(defaultQuery);
      const callArgs = mockPrisma.user.findMany.mock.calls[0]?.[0];
      expect(callArgs.cursor).toBeUndefined();
      expect(callArgs.skip).toBeUndefined();
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
    it('deletedAt과 status를 업데이트하고 결과를 반환한다', async () => {
      const now = new Date();
      mockPrisma.user.update.mockResolvedValue({ id: 'user-001', deletedAt: now });
      const result = await repository.softDeleteUser('user-001');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-001', deletedAt: null },
        data: { deletedAt: expect.any(Date), status: 'INACTIVE' },
        select: { id: true, deletedAt: true },
      });
      expect(result.userId).toBe('user-001');
      expect(result.deletedAt).toBe(now.toISOString());
    });

    it('tx가 전달되면 tx 클라이언트를 사용한다', async () => {
      const now = new Date();
      const txClient = { user: { update: jest.fn().mockResolvedValue({ id: 'user-001', deletedAt: now }) } };
      await repository.softDeleteUser('user-001', txClient as unknown as Prisma.TransactionClient);
      expect(txClient.user.update).toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
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
      expect(result?.skills[0]).toEqual({ skillTypeId: 'skill-001', skillName: 'GUITAR', level: 'ADVANCED', isPrimary: true });
      expect(result?.favoriteGenres[0]).toEqual({ genreId: 'genre-001', name: 'ROCK' });
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

    it('모든 변경 후 최신 프로필을 반환한다', async () => {
      const result = await repository.updateUserProfile('user-001', { profile: { nickname: '새닉네임' } });
      expect(result.user.id).toBe('user-001');
      expect(result.profile?.nickname).toBe('testuser');
    });
  });
});

import type { PrismaService } from '../../../database/prisma';

import { CommonPrismaRepository } from './common.prisma-repository';

const createPrismaMock = () => ({
  genre: { findMany: jest.fn() },
  skillType: { findMany: jest.fn() },
});

describe('CommonPrismaRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: CommonPrismaRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new CommonPrismaRepository(prisma as unknown as PrismaService);
  });

  describe('findAllGenres', () => {
    it('장르 목록을 name 오름차순으로 조회하고 genreId로 매핑해 반환한다', async () => {
      prisma.genre.findMany.mockResolvedValue([
        { id: 'genre-1', name: '락' },
        { id: 'genre-2', name: '재즈' },
      ]);

      const result = await repository.findAllGenres();

      expect(prisma.genre.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual({
        genres: [
          { genreId: 'genre-1', name: '락' },
          { genreId: 'genre-2', name: '재즈' },
        ],
      });
    });

    it('tx가 전달되면 tx 클라이언트를 사용한다', async () => {
      const tx = { genre: { findMany: jest.fn().mockResolvedValue([]) } };

      await repository.findAllGenres(tx as never);

      expect(tx.genre.findMany).toHaveBeenCalled();
      expect(prisma.genre.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findAllSkillTypes', () => {
    it('스킬 타입 목록을 name 오름차순으로 조회하고 skillTypeId로 매핑해 반환한다', async () => {
      prisma.skillType.findMany.mockResolvedValue([
        { id: 'skill-1', name: '보컬' },
        { id: 'skill-2', name: '일렉기타' },
      ]);

      const result = await repository.findAllSkillTypes();

      expect(prisma.skillType.findMany).toHaveBeenCalledWith({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual({
        skills: [
          { skillTypeId: 'skill-1', name: '보컬' },
          { skillTypeId: 'skill-2', name: '일렉기타' },
        ],
      });
    });

    it('tx가 전달되면 tx 클라이언트를 사용한다', async () => {
      const tx = { skillType: { findMany: jest.fn().mockResolvedValue([]) } };

      await repository.findAllSkillTypes(tx as never);

      expect(tx.skillType.findMany).toHaveBeenCalled();
      expect(prisma.skillType.findMany).not.toHaveBeenCalled();
    });
  });
});

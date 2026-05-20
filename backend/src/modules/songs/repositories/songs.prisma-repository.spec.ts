import type { PrismaService } from '../../../database/prisma';

import { SongsPrismaRepository } from './songs.prisma-repository';

const createPrismaMock = () => ({
  band: {
    findFirst: jest.fn(),
  },
  skillType: {
    findMany: jest.fn(),
  },
  song: {
    create: jest.fn(),
  },
  songSkill: {
    createMany: jest.fn(),
  },
});

describe('SongsPrismaRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: SongsPrismaRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new SongsPrismaRepository(prisma as unknown as PrismaService);
  });

  describe('findBandForSongCreate', () => {
    it('삭제되지 않은 밴드와 요청자 멤버를 조회한다', async () => {
      prisma.band.findFirst.mockResolvedValue({
        id: 'band-id',
        members: [
          {
            id: 'band-member-id',
            userId: 'user-id',
          },
        ],
      });

      const result = await repository.findBandForSongCreate('band-id', 'user-id');

      expect(prisma.band.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'band-id',
          deletedAt: null,
        },
        select: {
          id: true,
          members: {
            where: {
              userId: 'user-id',
            },
            select: {
              id: true,
              userId: true,
            },
            take: 1,
          },
        },
      });
      expect(result).toEqual({
        id: 'band-id',
        member: {
          id: 'band-member-id',
          userId: 'user-id',
        },
      });
    });

    it('밴드가 없으면 null을 반환한다', async () => {
      prisma.band.findFirst.mockResolvedValue(null);

      const result = await repository.findBandForSongCreate('band-id', 'user-id');

      expect(result).toBeNull();
    });

    it('밴드는 있지만 요청자가 멤버가 아니면 member를 null로 반환한다', async () => {
      prisma.band.findFirst.mockResolvedValue({
        id: 'band-id',
        members: [],
      });

      const result = await repository.findBandForSongCreate('band-id', 'user-id');

      expect(result).toEqual({
        id: 'band-id',
        member: null,
      });
    });

    it('tx가 전달되면 tx 클라이언트를 사용한다', async () => {
      const tx = {
        band: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };

      await repository.findBandForSongCreate('band-id', 'user-id', tx as never);

      expect(tx.band.findFirst).toHaveBeenCalled();
      expect(prisma.band.findFirst).not.toHaveBeenCalled();
    });
  });

  describe('findExistingSkillTypeIds', () => {
    it('존재하는 세션 타입 ID만 반환한다', async () => {
      prisma.skillType.findMany.mockResolvedValue([{ id: 'skill-type-1' }, { id: 'skill-type-2' }]);

      const result = await repository.findExistingSkillTypeIds(['skill-type-1', 'skill-type-2']);

      expect(prisma.skillType.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['skill-type-1', 'skill-type-2'],
          },
        },
        select: {
          id: true,
        },
      });
      expect(result).toEqual(['skill-type-1', 'skill-type-2']);
    });
  });

  describe('createSong', () => {
    const input = {
      bandId: 'band-id',
      userId: 'user-id',
      title: 'Harder, Better, Faster, Stronger',
      artistName: 'Daft Punk',
      sourceUrl: 'https://www.deezer.com/track/3135556',
      sourceType: 'DEEZER' as const,
      memo: '후렴 진입 전 드럼 큐 확인',
      createdByBandMemberId: 'band-member-id',
      skillTypeIds: ['skill-type-2', 'skill-type-1'],
    };

    beforeEach(() => {
      prisma.song.create.mockResolvedValue({
        id: 'song-id',
        bandId: 'band-id',
        title: 'Harder, Better, Faster, Stronger',
        artistName: 'Daft Punk',
        sourceUrl: 'https://www.deezer.com/track/3135556',
        sourceType: 'DEEZER',
        memo: '후렴 진입 전 드럼 큐 확인',
        key: null,
        bpm: null,
        difficultyLevel: null,
        createdAt: new Date('2026-05-20T00:00:00.000Z'),
      });
      prisma.songSkill.createMany.mockResolvedValue({ count: 2 });
      prisma.skillType.findMany.mockResolvedValue([
        {
          id: 'skill-type-1',
          name: '기타',
        },
        {
          id: 'skill-type-2',
          name: '보컬',
        },
      ]);
    });

    it('곡과 곡 세션 타입 연결 정보를 생성한다', async () => {
      await repository.createSong(input);

      expect(prisma.song.create).toHaveBeenCalledWith({
        data: {
          bandId: 'band-id',
          title: 'Harder, Better, Faster, Stronger',
          artistName: 'Daft Punk',
          sourceUrl: 'https://www.deezer.com/track/3135556',
          sourceType: 'DEEZER',
          memo: '후렴 진입 전 드럼 큐 확인',
          createdByBandMemberId: 'band-member-id',
        },
        select: {
          id: true,
          bandId: true,
          title: true,
          artistName: true,
          sourceUrl: true,
          sourceType: true,
          memo: true,
          key: true,
          bpm: true,
          difficultyLevel: true,
          createdAt: true,
        },
      });
      expect(prisma.songSkill.createMany).toHaveBeenCalledWith({
        data: [
          {
            songId: 'song-id',
            skillTypeId: 'skill-type-2',
          },
          {
            songId: 'song-id',
            skillTypeId: 'skill-type-1',
          },
        ],
      });
    });

    it('응답 세션 타입 순서는 요청 순서를 유지한다', async () => {
      const result = await repository.createSong(input);

      expect(result).toEqual({
        song: {
          id: 'song-id',
          bandId: 'band-id',
          title: 'Harder, Better, Faster, Stronger',
          artistName: 'Daft Punk',
          sourceUrl: 'https://www.deezer.com/track/3135556',
          sourceType: 'DEEZER',
          memo: '후렴 진입 전 드럼 큐 확인',
          key: null,
          bpm: null,
          difficultyLevel: null,
          userId: 'user-id',
          createdAt: '2026-05-20T00:00:00.000Z',
        },
        skillTypes: [
          {
            id: 'skill-type-2',
            name: '보컬',
          },
          {
            id: 'skill-type-1',
            name: '기타',
          },
        ],
      });
    });

    it('세션 타입이 없으면 곡 세션 타입 연결을 생성하지 않는다', async () => {
      await repository.createSong({
        ...input,
        skillTypeIds: [],
      });

      expect(prisma.songSkill.createMany).not.toHaveBeenCalled();
    });
  });
});

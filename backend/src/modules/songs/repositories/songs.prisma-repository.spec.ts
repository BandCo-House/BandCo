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
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  songSkill: {
    createMany: jest.fn(),
    deleteMany: jest.fn(),
  },
});

describe('SongsPrismaRepository', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let repository: SongsPrismaRepository;

  beforeEach(() => {
    prisma = createPrismaMock();
    repository = new SongsPrismaRepository(prisma as unknown as PrismaService);
  });

  describe('findActiveBandWithMemberByBandIdAndUserId', () => {
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

      const result = await repository.findActiveBandWithMemberByBandIdAndUserId('band-id', 'user-id');

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

      const result = await repository.findActiveBandWithMemberByBandIdAndUserId('band-id', 'user-id');

      expect(result).toBeNull();
    });

    it('밴드는 있지만 요청자가 멤버가 아니면 member를 null로 반환한다', async () => {
      prisma.band.findFirst.mockResolvedValue({
        id: 'band-id',
        members: [],
      });

      const result = await repository.findActiveBandWithMemberByBandIdAndUserId('band-id', 'user-id');

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

      await repository.findActiveBandWithMemberByBandIdAndUserId('band-id', 'user-id', tx as never);

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

  describe('findBandSongs', () => {
    it('검색어와 커서 조건으로 곡 목록을 조회한다', async () => {
      prisma.song.findMany.mockResolvedValue([]);

      await repository.findBandSongs('band-id', {
        where__title__contain: 'Harder',
        where__artist_name__contain: 'Daft',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
        cursor__created_at: '2026-05-20T00:00:00.000Z',
        cursor__id: 'cursor-song-id',
      });

      expect(prisma.song.findMany).toHaveBeenCalledWith({
        where: {
          bandId: 'band-id',
          AND: [
            {
              title: {
                contains: 'Harder',
                mode: 'insensitive',
              },
            },
            {
              artistName: {
                contains: 'Daft',
                mode: 'insensitive',
              },
            },
          ],
          OR: [
            {
              createdAt: {
                lt: new Date('2026-05-20T00:00:00.000Z'),
              },
            },
            {
              createdAt: new Date('2026-05-20T00:00:00.000Z'),
              id: {
                lt: 'cursor-song-id',
              },
            },
          ],
        },
        include: {
          songSkills: {
            include: {
              skillType: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              skillTypeId: 'asc',
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 20,
      });
    });

    it('조회 결과를 목록 응답으로 매핑한다', async () => {
      prisma.song.findMany.mockResolvedValue([
        {
          id: 'song-id-1',
          bandId: 'band-id',
          title: 'Harder, Better, Faster, Stronger',
          artistName: 'Daft Punk',
          key: null,
          bpm: null,
          difficultyLevel: null,
          sourceUrl: 'https://www.deezer.com/track/3135556',
          sourceType: 'DEEZER',
          createdAt: new Date('2026-05-20T00:00:00.000Z'),
          songSkills: [
            {
              skillTypeId: 'skill-type-1',
              skillType: {
                name: '기타',
              },
            },
          ],
        },
        {
          id: 'song-id-2',
          bandId: 'band-id',
          title: 'Around the World',
          artistName: 'Daft Punk',
          key: null,
          bpm: null,
          difficultyLevel: null,
          sourceUrl: 'https://www.deezer.com/track/3135557',
          sourceType: 'DEEZER',
          createdAt: new Date('2026-05-19T00:00:00.000Z'),
          songSkills: [],
        },
      ]);

      const result = await repository.findBandSongs('band-id', {
        order__created_at: 'desc',
        order__id: 'desc',
        take: 2,
      });

      expect(result).toEqual({
        items: [
          {
            id: 'song-id-1',
            bandId: 'band-id',
            title: 'Harder, Better, Faster, Stronger',
            artistName: 'Daft Punk',
            key: null,
            bpm: null,
            difficultyLevel: null,
            sourceUrl: 'https://www.deezer.com/track/3135556',
            sourceType: 'DEEZER',
            createdAt: '2026-05-20T00:00:00.000Z',
            skills: [
              {
                skillTypeId: 'skill-type-1',
                skillName: '기타',
              },
            ],
          },
          {
            id: 'song-id-2',
            bandId: 'band-id',
            title: 'Around the World',
            artistName: 'Daft Punk',
            key: null,
            bpm: null,
            difficultyLevel: null,
            sourceUrl: 'https://www.deezer.com/track/3135557',
            sourceType: 'DEEZER',
            createdAt: '2026-05-19T00:00:00.000Z',
            skills: [],
          },
        ],
        meta: {
          count: 2,
          take: 2,
          cursor: {
            createdAt: '2026-05-20T00:00:00.000Z',
            id: 'song-id-1',
          },
          next: {
            createdAt: '2026-05-19T00:00:00.000Z',
            id: 'song-id-2',
          },
        },
      });
    });

    it('결과가 없으면 cursor와 next가 null이다', async () => {
      prisma.song.findMany.mockResolvedValue([]);

      const result = await repository.findBandSongs('band-id', {
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(result.meta.cursor).toBeNull();
      expect(result.meta.next).toBeNull();
    });
  });

  describe('findSongWithBandMemberBySongIdAndUserId', () => {
    it('삭제되지 않은 밴드의 곡과 요청자 멤버를 조회한다', async () => {
      prisma.song.findFirst.mockResolvedValue({
        id: 'song-id',
        bandId: 'band-id',
        band: {
          members: [
            {
              id: 'band-member-id',
              userId: 'user-id',
            },
          ],
        },
      });

      const result = await repository.findSongWithBandMemberBySongIdAndUserId('song-id', 'user-id');

      expect(prisma.song.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'song-id',
          band: {
            deletedAt: null,
          },
        },
        select: {
          id: true,
          bandId: true,
          band: {
            select: {
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
          },
        },
      });
      expect(result).toEqual({
        id: 'song-id',
        bandId: 'band-id',
        member: {
          id: 'band-member-id',
          userId: 'user-id',
        },
      });
    });

    it('곡이 없으면 null을 반환한다', async () => {
      prisma.song.findFirst.mockResolvedValue(null);

      const result = await repository.findSongWithBandMemberBySongIdAndUserId('song-id', 'user-id');

      expect(result).toBeNull();
    });

    it('곡은 있지만 요청자가 밴드 멤버가 아니면 member를 null로 반환한다', async () => {
      prisma.song.findFirst.mockResolvedValue({
        id: 'song-id',
        bandId: 'band-id',
        band: {
          members: [],
        },
      });

      const result = await repository.findSongWithBandMemberBySongIdAndUserId('song-id', 'user-id');

      expect(result).toEqual({
        id: 'song-id',
        bandId: 'band-id',
        member: null,
      });
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

  describe('updateSong', () => {
    beforeEach(() => {
      prisma.songSkill.deleteMany.mockResolvedValue({ count: 2 });
      prisma.songSkill.createMany.mockResolvedValue({ count: 1 });
      prisma.song.update.mockResolvedValue({
        id: 'song-id',
        bandId: 'band-id',
        title: 'Harder, Better, Faster, Stronger',
        artistName: 'Daft Punk',
        sourceUrl: 'https://www.deezer.com/track/3135556',
        sourceType: 'DEEZER',
        memo: '템포 124 기준으로 연습',
        key: null,
        bpm: null,
        difficultyLevel: null,
        updatedAt: new Date('2026-05-20T00:00:00.000Z'),
        songSkills: [
          {
            skillTypeId: 'skill-type-1',
            skillType: {
              name: '기타',
            },
          },
        ],
      });
    });

    it('곡 기본 정보와 곡 세션 타입 연결을 수정한다', async () => {
      await repository.updateSong('song-id', {
        title: 'Harder, Better, Faster, Stronger',
        memo: '템포 124 기준으로 연습',
        skillTypeIds: ['skill-type-1'],
      });

      expect(prisma.songSkill.deleteMany).toHaveBeenCalledWith({
        where: {
          songId: 'song-id',
        },
      });
      expect(prisma.songSkill.createMany).toHaveBeenCalledWith({
        data: [
          {
            songId: 'song-id',
            skillTypeId: 'skill-type-1',
          },
        ],
      });
      expect(prisma.song.update).toHaveBeenCalledWith({
        where: {
          id: 'song-id',
        },
        data: {
          title: 'Harder, Better, Faster, Stronger',
          memo: '템포 124 기준으로 연습',
        },
        include: {
          songSkills: {
            include: {
              skillType: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              skillTypeId: 'asc',
            },
          },
        },
      });
    });

    it('skillTypeIds가 없으면 곡 세션 타입 연결을 수정하지 않는다', async () => {
      await repository.updateSong('song-id', {
        memo: null,
      });

      expect(prisma.songSkill.deleteMany).not.toHaveBeenCalled();
      expect(prisma.songSkill.createMany).not.toHaveBeenCalled();
      expect(prisma.song.update).toHaveBeenCalledWith(expect.objectContaining({ data: { memo: null } }));
    });

    it('skillTypeIds가 빈 배열이면 기존 연결만 삭제한다', async () => {
      await repository.updateSong('song-id', {
        skillTypeIds: [],
      });

      expect(prisma.songSkill.deleteMany).toHaveBeenCalledWith({
        where: {
          songId: 'song-id',
        },
      });
      expect(prisma.songSkill.createMany).not.toHaveBeenCalled();
    });

    it('수정된 곡 정보를 응답 형태로 매핑한다', async () => {
      const result = await repository.updateSong('song-id', {
        memo: '템포 124 기준으로 연습',
      });

      expect(result).toEqual({
        song: {
          id: 'song-id',
          bandId: 'band-id',
          title: 'Harder, Better, Faster, Stronger',
          artistName: 'Daft Punk',
          sourceUrl: 'https://www.deezer.com/track/3135556',
          sourceType: 'DEEZER',
          memo: '템포 124 기준으로 연습',
          key: null,
          bpm: null,
          difficultyLevel: null,
          updatedAt: '2026-05-20T00:00:00.000Z',
          skills: [
            {
              skillTypeId: 'skill-type-1',
              skillName: '기타',
            },
          ],
        },
      });
    });
  });
});

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma';
import type { SkillsService } from '../skills/skills.service';

import type { SongsRepository } from './repositories/songs.repository';
import type { DeezerTrackReader, DeezerTrackSearcher } from './deezer-track.client';
import { SongsService } from './songs.service';

describe('SongsService', () => {
  const createService = (repositoryOverrides: Partial<SongsRepository> = {}) => {
    const transactionClient = {};
    const prisma = {
      $transaction: jest.fn(async callback => callback(transactionClient)),
    } as unknown as PrismaService;

    const repository: jest.Mocked<SongsRepository> = {
      findActiveBandWithMemberByBandIdAndUserId: jest.fn(),
      createSong: jest.fn(),
      findBandSongs: jest.fn(),
      findSongWithBandMemberBySongIdAndUserId: jest.fn(),
      updateSong: jest.fn(),
      deleteSong: jest.fn(),
      ...repositoryOverrides,
    } as jest.Mocked<SongsRepository>;

    const deezerTrackSearcher: jest.Mocked<DeezerTrackSearcher & DeezerTrackReader> = {
      searchTracks: jest.fn(),
      findTrack: jest.fn(),
    };
    const skillsService: jest.Mocked<SkillsService> = {
      findExistingSkillTypeIds: jest.fn(),
    } as unknown as jest.Mocked<SkillsService>;

    const service = new SongsService(repository, prisma, skillsService, deezerTrackSearcher);

    return {
      service,
      repository,
      prisma,
      transactionClient,
      skillsService,
      deezerTrackSearcher,
    };
  };

  it('외부 음원 검색 서비스는 검색 결과를 곡 미리보기 목록으로 변환한다', async () => {
    const { service, deezerTrackSearcher } = createService();

    deezerTrackSearcher.searchTracks.mockResolvedValue([
      {
        id: 3135556,
        title: 'Harder, Better, Faster, Stronger',
        duration: 224,
        link: 'https://www.deezer.com/track/3135556',
        preview: 'https://cdns-preview.dzcdn.net/stream/demo.mp3',
        artist: {
          name: 'Daft Punk',
        },
        album: {
          title: 'Discovery',
          cover: 'https://api.deezer.com/album/302127/image',
          cover_medium: 'https://e-cdns-images.dzcdn.net/images/cover/medium.jpg',
          cover_big: 'https://e-cdns-images.dzcdn.net/images/cover/big.jpg',
          cover_xl: 'https://e-cdns-images.dzcdn.net/images/cover/xl.jpg',
        },
      },
    ]);

    const result = await service.searchTrackPreviews('Daft Punk Harder Better Faster Stronger');

    expect(deezerTrackSearcher.searchTracks).toHaveBeenCalledWith('Daft Punk Harder Better Faster Stronger');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      externalTrackId: '3135556',
      title: 'Harder, Better, Faster, Stronger',
      artistName: 'Daft Punk',
      albumName: 'Discovery',
      durationMs: 224000,
      sourceUrl: 'https://www.deezer.com/track/3135556',
      sourceType: 'DEEZER',
    });
  });

  it('외부 음원 곡 미리듣기 서비스는 트랙 ID로 단일 트랙을 변환한다', async () => {
    const { service, deezerTrackSearcher } = createService();

    deezerTrackSearcher.findTrack.mockResolvedValue({
      id: 3135556,
      title: 'Harder, Better, Faster, Stronger',
      duration: 224,
      link: 'https://www.deezer.com/track/3135556',
      preview: 'https://cdns-preview.dzcdn.net/stream/demo.mp3',
      artist: {
        name: 'Daft Punk',
      },
      album: {
        title: 'Discovery',
        cover: 'https://api.deezer.com/album/302127/image',
        cover_medium: 'https://e-cdns-images.dzcdn.net/images/cover/medium.jpg',
        cover_big: 'https://e-cdns-images.dzcdn.net/images/cover/big.jpg',
        cover_xl: 'https://e-cdns-images.dzcdn.net/images/cover/xl.jpg',
      },
    });

    const result = await service.getTrackPreview('3135556');

    expect(deezerTrackSearcher.findTrack).toHaveBeenCalledWith('3135556');
    expect(result).toMatchObject({
      externalTrackId: '3135556',
      title: 'Harder, Better, Faster, Stronger',
      artistName: 'Daft Punk',
      durationMs: 224000,
      previewUrl: 'https://cdns-preview.dzcdn.net/stream/demo.mp3',
      sourceUrl: 'https://www.deezer.com/track/3135556',
      sourceType: 'DEEZER',
    });
  });

  it('밴드 멤버가 곡을 생성하면 세션 타입을 검증하고 곡을 저장한다', async () => {
    const { service, repository, transactionClient, skillsService } = createService();

    repository.findActiveBandWithMemberByBandIdAndUserId.mockResolvedValue({
      id: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    skillsService.findExistingSkillTypeIds.mockResolvedValue({ skillTypeIds: ['skill-type-1', 'skill-type-2'] });
    repository.createSong.mockResolvedValue({
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
        songCoverUrl: 'https://storage.example.com/song-covers/uuid.jpg',
        songLength: 355,
        externalLinks: ['https://youtube.com/watch?v=uuid'],
        referenceFiles: [
          {
            id: 'reference-file-id',
            fileUrl: 'https://storage.example.com/song-references/uuid.pdf',
            fileName: '악보_1절.pdf',
            createdAt: '2026-05-20T00:00:00.000Z',
          },
        ],
        userId: 'user-id',
        createdAt: '2026-05-20T00:00:00.000Z',
      },
      skillTypes: [
        {
          id: 'skill-type-1',
          name: '보컬',
        },
        {
          id: 'skill-type-2',
          name: '기타',
        },
      ],
    });

    const result = await service.createSong('user-id', 'band-id', {
      title: 'Harder, Better, Faster, Stronger',
      artistName: 'Daft Punk',
      sourceUrl: 'https://www.deezer.com/track/3135556',
      sourceType: 'DEEZER',
      memo: '후렴 진입 전 드럼 큐 확인',
      skillTypeIds: ['skill-type-1', 'skill-type-2'],
      songCoverUrl: 'https://storage.example.com/song-covers/uuid.jpg',
      songLength: 355,
      externalLinks: ['https://youtube.com/watch?v=uuid'],
      referenceFiles: [{ fileUrl: 'https://storage.example.com/song-references/uuid.pdf', fileName: '악보_1절.pdf' }],
    });

    expect(repository.findActiveBandWithMemberByBandIdAndUserId).toHaveBeenCalledWith('band-id', 'user-id', transactionClient);
    expect(skillsService.findExistingSkillTypeIds).toHaveBeenCalledWith(['skill-type-1', 'skill-type-2'], transactionClient);
    expect(repository.createSong).toHaveBeenCalledWith(
      {
        title: 'Harder, Better, Faster, Stronger',
        artistName: 'Daft Punk',
        sourceUrl: 'https://www.deezer.com/track/3135556',
        sourceType: 'DEEZER',
        memo: '후렴 진입 전 드럼 큐 확인',
        skillTypeIds: ['skill-type-1', 'skill-type-2'],
        songCoverUrl: 'https://storage.example.com/song-covers/uuid.jpg',
        songLength: 355,
        externalLinks: ['https://youtube.com/watch?v=uuid'],
        referenceFiles: [{ fileUrl: 'https://storage.example.com/song-references/uuid.pdf', fileName: '악보_1절.pdf' }],
        bandId: 'band-id',
        userId: 'user-id',
        createdByBandMemberId: 'band-member-id',
      },
      transactionClient,
    );
    expect(result.song.userId).toBe('user-id');
    expect(result.song.referenceFiles).toHaveLength(1);
  });

  it('상위 트랜잭션이 있으면 새 트랜잭션을 열지 않는다', async () => {
    const { service, repository, prisma, skillsService } = createService();
    const tx = {};

    repository.findActiveBandWithMemberByBandIdAndUserId.mockResolvedValue({
      id: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    repository.createSong.mockResolvedValue({
      song: {
        id: 'song-id',
        bandId: 'band-id',
        title: 'Song',
        artistName: 'Artist',
        sourceUrl: 'https://www.deezer.com/track/3135556',
        sourceType: 'DEEZER',
        memo: null,
        key: null,
        bpm: null,
        difficultyLevel: null,
        songCoverUrl: null,
        songLength: null,
        externalLinks: [],
        referenceFiles: [],
        userId: 'user-id',
        createdAt: '2026-05-20T00:00:00.000Z',
      },
      skillTypes: [],
    });

    await service.createSong(
      'user-id',
      'band-id',
      {
        title: 'Song',
        artistName: 'Artist',
        sourceUrl: 'https://www.deezer.com/track/3135556',
        sourceType: 'DEEZER',
      },
      tx as never,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.findActiveBandWithMemberByBandIdAndUserId).toHaveBeenCalledWith('band-id', 'user-id', tx);
    expect(skillsService.findExistingSkillTypeIds).not.toHaveBeenCalled();
  });

  it('세션 타입 ID가 중복되면 BadRequestException을 던진다', async () => {
    const { service, repository } = createService();

    await expect(
      service.createSong('user-id', 'band-id', {
        title: 'Song',
        artistName: 'Artist',
        sourceUrl: 'https://www.deezer.com/track/3135556',
        sourceType: 'DEEZER',
        skillTypeIds: ['skill-type-1', 'skill-type-1'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findActiveBandWithMemberByBandIdAndUserId).not.toHaveBeenCalled();
  });

  it('밴드가 없으면 NotFoundException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findActiveBandWithMemberByBandIdAndUserId.mockResolvedValue(null);

    await expect(
      service.createSong('user-id', 'band-id', {
        title: 'Song',
        artistName: 'Artist',
        sourceUrl: 'https://www.deezer.com/track/3135556',
        sourceType: 'DEEZER',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findActiveBandWithMemberByBandIdAndUserId.mockResolvedValue({
      id: 'band-id',
      member: null,
    });

    await expect(
      service.createSong('user-id', 'band-id', {
        title: 'Song',
        artistName: 'Artist',
        sourceUrl: 'https://www.deezer.com/track/3135556',
        sourceType: 'DEEZER',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('존재하지 않는 세션 타입이 있으면 BadRequestException을 던진다', async () => {
    const { service, repository, skillsService } = createService();

    repository.findActiveBandWithMemberByBandIdAndUserId.mockResolvedValue({
      id: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    skillsService.findExistingSkillTypeIds.mockResolvedValue({ skillTypeIds: ['skill-type-1'] });

    await expect(
      service.createSong('user-id', 'band-id', {
        title: 'Song',
        artistName: 'Artist',
        sourceUrl: 'https://www.deezer.com/track/3135556',
        sourceType: 'DEEZER',
        skillTypeIds: ['skill-type-1', 'skill-type-2'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.createSong).not.toHaveBeenCalled();
  });

  it('밴드 멤버가 곡 목록을 조회한다', async () => {
    const { service, repository } = createService();

    repository.findActiveBandWithMemberByBandIdAndUserId.mockResolvedValue({
      id: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    repository.findBandSongs.mockResolvedValue({
      items: [
        {
          id: 'song-id',
          bandId: 'band-id',
          title: 'Harder, Better, Faster, Stronger',
          artistName: 'Daft Punk',
          key: null,
          bpm: null,
          difficultyLevel: null,
          sourceUrl: 'https://www.deezer.com/track/3135556',
          sourceType: 'DEEZER',
          songCoverUrl: null,
          songLength: null,
          externalLinks: [],
          referenceFiles: [],
          createdAt: '2026-05-20T00:00:00.000Z',
          skills: [
            {
              skillTypeId: 'skill-type-id',
              skillName: '기타',
            },
          ],
        },
      ],
      meta: {
        count: 1,
        take: 20,
        cursor: {
          id: 'song-id',
        },
        next: null,
      },
    });

    const query = {
      order__created_at: 'desc' as const,
      order__id: 'desc' as const,
      take: 20,
      where__title__contain: 'Harder',
    };

    const result = await service.getBandSongs('user-id', 'band-id', query);

    expect(repository.findActiveBandWithMemberByBandIdAndUserId).toHaveBeenCalledWith('band-id', 'user-id', undefined);
    expect(repository.findBandSongs).toHaveBeenCalledWith('band-id', query, undefined);
    expect(result.items).toHaveLength(1);
  });

  it('곡 목록 조회 시 밴드가 없으면 NotFoundException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findActiveBandWithMemberByBandIdAndUserId.mockResolvedValue(null);

    await expect(
      service.getBandSongs('user-id', 'band-id', {
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('곡 목록 조회 시 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findActiveBandWithMemberByBandIdAndUserId.mockResolvedValue({
      id: 'band-id',
      member: null,
    });

    await expect(
      service.getBandSongs('user-id', 'band-id', {
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('곡 목록 조회 정렬 방향이 다르면 BadRequestException을 던진다', async () => {
    const { service, repository } = createService();

    await expect(
      service.getBandSongs('user-id', 'band-id', {
        order__created_at: 'desc',
        order__id: 'asc',
        take: 20,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findActiveBandWithMemberByBandIdAndUserId).not.toHaveBeenCalled();
  });

  it('밴드 멤버가 곡을 수정하면 세션 타입을 검증하고 저장한다', async () => {
    const { service, repository, transactionClient, skillsService } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    skillsService.findExistingSkillTypeIds.mockResolvedValue({ skillTypeIds: ['skill-type-1'] });
    repository.updateSong.mockResolvedValue({
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
        songCoverUrl: null,
        songLength: null,
        externalLinks: [],
        referenceFiles: [],
        updatedAt: '2026-05-20T00:00:00.000Z',
        skills: [
          {
            skillTypeId: 'skill-type-1',
            skillName: '기타',
          },
        ],
      },
    });

    const input = {
      memo: '템포 124 기준으로 연습',
      skillTypeIds: ['skill-type-1'],
    };

    const result = await service.updateSong('user-id', 'song-id', input);

    expect(repository.findSongWithBandMemberBySongIdAndUserId).toHaveBeenCalledWith('song-id', 'user-id', transactionClient);
    expect(skillsService.findExistingSkillTypeIds).toHaveBeenCalledWith(['skill-type-1'], transactionClient);
    expect(repository.updateSong).toHaveBeenCalledWith('song-id', input, transactionClient);
    expect(result.song.memo).toBe('템포 124 기준으로 연습');
  });

  it('곡 수정 시 상위 트랜잭션이 있으면 새 트랜잭션을 열지 않는다', async () => {
    const { service, repository, prisma } = createService();
    const tx = {};

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    repository.updateSong.mockResolvedValue({
      song: {
        id: 'song-id',
        bandId: 'band-id',
        title: 'Song',
        artistName: 'Artist',
        sourceUrl: null,
        sourceType: null,
        memo: null,
        key: null,
        bpm: null,
        difficultyLevel: null,
        songCoverUrl: null,
        songLength: null,
        externalLinks: [],
        referenceFiles: [],
        updatedAt: '2026-05-20T00:00:00.000Z',
        skills: [],
      },
    });

    await service.updateSong('user-id', 'song-id', { memo: null }, tx as never);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.findSongWithBandMemberBySongIdAndUserId).toHaveBeenCalledWith('song-id', 'user-id', tx);
    expect(repository.updateSong).toHaveBeenCalledWith('song-id', { memo: null }, tx);
  });

  it('곡 수정 시 신규 미디어 필드만 전달해도 수정할 수 있다', async () => {
    const { service, repository, transactionClient } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    repository.updateSong.mockResolvedValue({
      song: {
        id: 'song-id',
        bandId: 'band-id',
        title: 'Song',
        artistName: 'Artist',
        sourceUrl: null,
        sourceType: null,
        memo: null,
        key: null,
        bpm: null,
        difficultyLevel: null,
        songCoverUrl: null,
        songLength: 355,
        externalLinks: [],
        referenceFiles: [],
        updatedAt: '2026-05-20T00:00:00.000Z',
        skills: [],
      },
    });

    const input = { songCoverUrl: null, songLength: 355, externalLinks: [], referenceFiles: [] };

    const result = await service.updateSong('user-id', 'song-id', input);

    expect(repository.updateSong).toHaveBeenCalledWith('song-id', input, transactionClient);
    expect(result.song.songLength).toBe(355);
  });

  it('곡 수정 본문이 비어 있으면 BadRequestException을 던진다', async () => {
    const { service, repository } = createService();

    await expect(service.updateSong('user-id', 'song-id', {})).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.findSongWithBandMemberBySongIdAndUserId).not.toHaveBeenCalled();
  });

  it('곡 수정 시 곡이 없으면 NotFoundException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue(null);

    await expect(service.updateSong('user-id', 'song-id', { memo: '메모' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('곡 수정 시 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: null,
    });

    await expect(service.updateSong('user-id', 'song-id', { memo: '메모' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('곡 수정 시 세션 타입 ID가 중복되면 BadRequestException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });

    await expect(service.updateSong('user-id', 'song-id', { skillTypeIds: ['skill-type-1', 'skill-type-1'] })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.updateSong).not.toHaveBeenCalled();
  });

  it('곡 수정 시 존재하지 않는 세션 타입이 있으면 BadRequestException을 던진다', async () => {
    const { service, repository, skillsService } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    skillsService.findExistingSkillTypeIds.mockResolvedValue({ skillTypeIds: [] });

    await expect(service.updateSong('user-id', 'song-id', { skillTypeIds: ['skill-type-1'] })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.updateSong).not.toHaveBeenCalled();
  });

  it('밴드 멤버가 곡을 삭제한다', async () => {
    const { service, repository, transactionClient } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    repository.deleteSong.mockResolvedValue({
      songId: 'song-id',
      deletedAt: '2026-05-20T00:00:00.000Z',
    });

    const result = await service.deleteSong('user-id', 'song-id');

    expect(repository.findSongWithBandMemberBySongIdAndUserId).toHaveBeenCalledWith('song-id', 'user-id', transactionClient);
    expect(repository.deleteSong).toHaveBeenCalledWith('song-id', expect.any(Date), transactionClient);
    expect(result.songId).toBe('song-id');
  });

  it('곡 삭제 시 상위 트랜잭션이 있으면 새 트랜잭션을 열지 않는다', async () => {
    const { service, repository, prisma } = createService();
    const tx = {};

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    repository.deleteSong.mockResolvedValue({
      songId: 'song-id',
      deletedAt: '2026-05-20T00:00:00.000Z',
    });

    await service.deleteSong('user-id', 'song-id', tx as never);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(repository.findSongWithBandMemberBySongIdAndUserId).toHaveBeenCalledWith('song-id', 'user-id', tx);
    expect(repository.deleteSong).toHaveBeenCalledWith('song-id', expect.any(Date), tx);
  });

  it('곡 삭제 시 곡이 없으면 NotFoundException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue(null);

    await expect(service.deleteSong('user-id', 'song-id')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.deleteSong).not.toHaveBeenCalled();
  });

  it('곡 삭제 실행 시 이미 삭제된 곡이면 NotFoundException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: {
        id: 'band-member-id',
        userId: 'user-id',
      },
    });
    repository.deleteSong.mockResolvedValue(undefined);

    await expect(service.deleteSong('user-id', 'song-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('곡 삭제 시 밴드 멤버가 아니면 ForbiddenException을 던진다', async () => {
    const { service, repository } = createService();

    repository.findSongWithBandMemberBySongIdAndUserId.mockResolvedValue({
      id: 'song-id',
      bandId: 'band-id',
      member: null,
    });

    await expect(service.deleteSong('user-id', 'song-id')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.deleteSong).not.toHaveBeenCalled();
  });
});

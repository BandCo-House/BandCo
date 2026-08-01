import { Injectable } from '@nestjs/common';

import { parseToPrismaQuery } from '../../../common/query';
import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { GetBandSongsQuery } from '../dto/get-band-songs-query.dto';
import type { UpdateSongInput } from '../dto/update-song.dto';
import type { CreatedSongSkillType, CreateSongResult } from '../types/create-song-result.type';
import type { DeleteSongResult } from '../types/delete-song-result.type';
import type { ActiveBandWithMember, SongWithBandMember } from '../types/song-access-context.type';
import type { GetBandSongsResult, SongListItem } from '../types/song-list.type';
import type { SongSourceType } from '../types/song-preview.type';
import type { SongReferenceFileItem } from '../types/song-reference-file.type';
import type { UpdateSongResult } from '../types/update-song-result.type';

import type { CreateSongRepositoryInput, SongsRepository } from './songs.repository';

@Injectable()
export class SongsPrismaRepository implements SongsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 곡 생성 정책 판단에 필요한 밴드와 요청자 멤버 정보를 조회한다.
   *
   * @param {string} bandId - 곡을 추가할 밴드 ID
   * @param {string} userId - 인증된 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ActiveBandWithMember | null>} 삭제되지 않은 밴드와 요청자 멤버 정보
   */
  async findActiveBandWithMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ActiveBandWithMember | null> {
    const client = tx ?? this.prisma;

    const band = await client.band.findFirst({
      where: {
        id: bandId,
        deletedAt: null,
      },
      select: {
        id: true,
        members: {
          where: {
            userId,
          },
          select: {
            id: true,
            userId: true,
          },
          take: 1,
        },
      },
    });

    if (band === null) {
      return null;
    }

    return {
      id: band.id,
      member: band.members[0] ?? null,
    };
  }

  /**
   * 밴드의 곡 목록을 생성 시점과 ID 기준으로 정렬해 조회한다.
   *
   * @param {string} bandId - 조회할 밴드 ID
   * @param {GetBandSongsQuery} query - 검색어와 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetBandSongsResult>} 밴드 곡 목록
   */
  async findBandSongs(bandId: string, query: GetBandSongsQuery, tx?: Prisma.TransactionClient): Promise<GetBandSongsResult> {
    const client = tx ?? this.prisma;
    const { where, orderBy } = parseToPrismaQuery<Prisma.SongWhereInput>(query);
    where.bandId = bandId;

    const songs = await client.song.findMany({
      where,
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
        referenceFiles: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy,
      ...(query.cursor__id ? { cursor: { id: query.cursor__id }, skip: 1 } : {}),
      take: query.take,
    });

    const items = songs.map(song => this.mapSongListItem(song));
    const count = items.length;
    const cursor = count > 0 ? { id: items[0].id } : null;
    const next = count === query.take ? { id: items[count - 1].id } : null;

    return {
      items,
      meta: {
        count,
        take: query.take,
        cursor,
        next,
      },
    };
  }

  /**
   * 곡 수정 권한 판단에 필요한 곡의 밴드와 요청자 멤버 정보를 조회한다.
   *
   * @param {string} songId - 수정할 곡 ID
   * @param {string} userId - 인증된 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SongWithBandMember | null>} 곡과 요청자 멤버 정보
   */
  async findSongWithBandMemberBySongIdAndUserId(songId: string, userId: string, tx?: Prisma.TransactionClient): Promise<SongWithBandMember | null> {
    const client = tx ?? this.prisma;

    const song = await client.song.findFirst({
      where: {
        id: songId,
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
                userId,
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

    if (song === null) {
      return null;
    }

    return {
      id: song.id,
      bandId: song.bandId,
      member: song.band.members[0] ?? null,
    };
  }

  /**
   * 곡과 곡 세션 타입 연결 정보를 같은 작업 단위에서 생성한다.
   *
   * @param {CreateSongRepositoryInput} input - Service에서 정책 검증이 끝난 곡 생성 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateSongResult>} 생성된 곡과 연결된 세션 타입 목록
   */
  async createSong(input: CreateSongRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateSongResult> {
    const client = tx ?? this.prisma;

    const song = await client.song.create({
      data: {
        bandId: input.bandId,
        title: input.title,
        artistName: input.artistName,
        sourceUrl: input.sourceUrl,
        sourceType: input.sourceType,
        externalTrackId: input.externalTrackId,
        memo: input.memo,
        songCoverUrl: input.songCoverUrl,
        songLength: input.songLength,
        externalLinks: input.externalLinks,
        createdByBandMemberId: input.createdByBandMemberId,
      },
      select: {
        id: true,
        bandId: true,
        title: true,
        artistName: true,
        sourceUrl: true,
        sourceType: true,
        externalTrackId: true,
        memo: true,
        key: true,
        bpm: true,
        difficultyLevel: true,
        songCoverUrl: true,
        songLength: true,
        externalLinks: true,
        createdAt: true,
      },
    });

    if (input.skillTypeIds.length > 0) {
      await client.songSkill.createMany({
        data: input.skillTypeIds.map(skillTypeId => ({
          songId: song.id,
          skillTypeId,
        })),
      });
    }

    if (input.referenceFiles !== undefined && input.referenceFiles.length > 0) {
      await client.songReferenceFile.createMany({
        data: input.referenceFiles.map(referenceFile => ({
          songId: song.id,
          fileUrl: referenceFile.fileUrl,
          fileName: referenceFile.fileName,
        })),
      });
    }

    const skillTypes = await client.skillType.findMany({
      where: {
        id: {
          in: input.skillTypeIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const referenceFiles = await client.songReferenceFile.findMany({
      where: {
        songId: song.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        fileUrl: true,
        fileName: true,
        createdAt: true,
      },
    });

    return {
      song: {
        id: song.id,
        bandId: song.bandId,
        title: song.title,
        artistName: song.artistName,
        sourceUrl: song.sourceUrl,
        sourceType: song.sourceType as SongSourceType | null,
        externalTrackId: song.externalTrackId,
        memo: song.memo,
        key: song.key,
        bpm: song.bpm,
        difficultyLevel: song.difficultyLevel,
        songCoverUrl: song.songCoverUrl,
        songLength: song.songLength,
        externalLinks: song.externalLinks,
        referenceFiles: this.mapReferenceFiles(referenceFiles),
        userId: input.userId,
        createdAt: song.createdAt.toISOString(),
      },
      skillTypes: this.mapSkillTypes(input.skillTypeIds, skillTypes),
    };
  }

  /**
   * 곡 기본 정보와 곡 세션 타입 연결을 수정한다.
   *
   * @param {string} songId - 수정할 곡 ID
   * @param {UpdateSongInput} input - Service 검증이 끝난 곡 수정 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateSongResult>} 수정된 곡 정보
   */
  async updateSong(songId: string, input: UpdateSongInput, tx?: Prisma.TransactionClient): Promise<UpdateSongResult> {
    const client = tx ?? this.prisma;

    if (input.skillTypeIds !== undefined) {
      await client.songSkill.deleteMany({
        where: {
          songId,
        },
      });

      if (input.skillTypeIds.length > 0) {
        await client.songSkill.createMany({
          data: input.skillTypeIds.map(skillTypeId => ({
            songId,
            skillTypeId,
          })),
        });
      }
    }

    if (input.referenceFiles !== undefined) {
      await client.songReferenceFile.deleteMany({
        where: {
          songId,
        },
      });

      if (input.referenceFiles.length > 0) {
        await client.songReferenceFile.createMany({
          data: input.referenceFiles.map(referenceFile => ({
            songId,
            fileUrl: referenceFile.fileUrl,
            fileName: referenceFile.fileName,
          })),
        });
      }
    }

    const updatedSong = await client.song.update({
      where: {
        id: songId,
      },
      data: this.createUpdateSongData(input),
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
        referenceFiles: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return {
      song: {
        id: updatedSong.id,
        bandId: updatedSong.bandId,
        title: updatedSong.title,
        artistName: updatedSong.artistName,
        sourceUrl: updatedSong.sourceUrl,
        sourceType: updatedSong.sourceType as SongSourceType | null,
        memo: updatedSong.memo,
        key: updatedSong.key,
        bpm: updatedSong.bpm,
        difficultyLevel: updatedSong.difficultyLevel,
        songCoverUrl: updatedSong.songCoverUrl,
        songLength: updatedSong.songLength,
        externalLinks: updatedSong.externalLinks,
        referenceFiles: this.mapReferenceFiles(updatedSong.referenceFiles),
        updatedAt: updatedSong.updatedAt.toISOString(),
        skills: updatedSong.songSkills.map(songSkill => ({
          skillTypeId: songSkill.skillTypeId,
          skillName: songSkill.skillType.name,
        })),
      },
    };
  }

  /**
   * Song은 삭제 상태 컬럼이 없으므로 hard delete 한다.
   *
   * @param {string} songId - 삭제할 곡 ID
   * @param {Date} deletedAt - 응답에 표시할 삭제 처리 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeleteSongResult | undefined>} 삭제 처리 결과 또는 대상 없음
   */
  async deleteSong(songId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<DeleteSongResult | undefined> {
    const client = tx ?? this.prisma;

    try {
      const deletedSong = await client.song.delete({
        where: {
          id: songId,
        },
        select: {
          id: true,
        },
      });

      return {
        songId: deletedSong.id,
        deletedAt: deletedAt.toISOString(),
      };
    } catch (error) {
      if (this.isPrismaRecordNotFoundError(error)) {
        return undefined;
      }

      throw error;
    }
  }

  private isPrismaRecordNotFoundError(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    return 'code' in error && error.code === 'P2025';
  }

  private mapSkillTypes(skillTypeIds: string[], skillTypes: CreatedSongSkillType[]): CreatedSongSkillType[] {
    return skillTypeIds
      .map(skillTypeId => skillTypes.find(skillType => skillType.id === skillTypeId))
      .filter((skillType): skillType is CreatedSongSkillType => skillType !== undefined);
  }

  private createUpdateSongData(input: UpdateSongInput): Prisma.SongUpdateInput {
    const data: Prisma.SongUpdateInput = {};

    if (input.title !== undefined) {
      data.title = input.title;
    }

    if (input.artistName !== undefined) {
      data.artistName = input.artistName;
    }

    if (input.sourceUrl !== undefined) {
      data.sourceUrl = input.sourceUrl;
    }

    if (input.sourceType !== undefined) {
      data.sourceType = input.sourceType;
    }

    if (input.memo !== undefined) {
      data.memo = input.memo;
    }

    if (input.songCoverUrl !== undefined) {
      data.songCoverUrl = input.songCoverUrl;
    }

    if (input.songLength !== undefined) {
      data.songLength = input.songLength;
    }

    if (input.externalLinks !== undefined) {
      data.externalLinks = { set: input.externalLinks };
    }

    return data;
  }

  private mapReferenceFiles(referenceFiles: { id: string; fileUrl: string; fileName: string; createdAt: Date }[]): SongReferenceFileItem[] {
    return referenceFiles.map(referenceFile => ({
      id: referenceFile.id,
      fileUrl: referenceFile.fileUrl,
      fileName: referenceFile.fileName,
      createdAt: referenceFile.createdAt.toISOString(),
    }));
  }

  private mapSongListItem(
    song: Prisma.SongGetPayload<{
      include: {
        songSkills: {
          include: {
            skillType: {
              select: {
                name: true;
              };
            };
          };
        };
        referenceFiles: true;
      };
    }>,
  ): SongListItem {
    return {
      id: song.id,
      bandId: song.bandId,
      title: song.title,
      artistName: song.artistName,
      key: song.key,
      bpm: song.bpm,
      difficultyLevel: song.difficultyLevel,
      sourceUrl: song.sourceUrl,
      sourceType: song.sourceType as SongSourceType | null,
      externalTrackId: song.externalTrackId,
      songCoverUrl: song.songCoverUrl,
      songLength: song.songLength,
      externalLinks: song.externalLinks,
      referenceFiles: this.mapReferenceFiles(song.referenceFiles),
      createdAt: song.createdAt.toISOString(),
      skills: song.songSkills.map(songSkill => ({
        skillTypeId: songSkill.skillTypeId,
        skillName: songSkill.skillType.name,
      })),
    };
  }
}

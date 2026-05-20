import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { CreatedSongSkillType, CreateSongResult } from '../types/create-song-result.type';
import type { SongSourceType } from '../types/song-preview.type';

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
   * @returns {Promise<{ id: string; member: { id: string; userId: string } | null } | null>} 삭제되지 않은 밴드와 요청자 멤버 정보
   */
  async findBandForSongCreate(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    member: {
      id: string;
      userId: string;
    } | null;
  } | null> {
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
   * 요청받은 세션 타입 ID가 실제로 존재하는지 확인한다.
   *
   * @param {string[]} skillTypeIds - 확인할 세션 타입 ID 목록
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<string[]>} 존재하는 세션 타입 ID 목록
   */
  async findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<string[]> {
    const client = tx ?? this.prisma;

    const skillTypes = await client.skillType.findMany({
      where: {
        id: {
          in: skillTypeIds,
        },
      },
      select: {
        id: true,
      },
    });

    return skillTypes.map(skillType => skillType.id);
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
        memo: input.memo,
        createdByBandMemberId: input.createdByBandMemberId,
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

    if (input.skillTypeIds.length > 0) {
      await client.songSkill.createMany({
        data: input.skillTypeIds.map(skillTypeId => ({
          songId: song.id,
          skillTypeId,
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

    return {
      song: {
        id: song.id,
        bandId: song.bandId,
        title: song.title,
        artistName: song.artistName,
        sourceUrl: song.sourceUrl,
        sourceType: song.sourceType as SongSourceType | null,
        memo: song.memo,
        key: song.key,
        bpm: song.bpm,
        difficultyLevel: song.difficultyLevel,
        userId: input.userId,
        createdAt: song.createdAt.toISOString(),
      },
      skillTypes: this.mapSkillTypes(input.skillTypeIds, skillTypes),
    };
  }

  private mapSkillTypes(skillTypeIds: string[], skillTypes: CreatedSongSkillType[]): CreatedSongSkillType[] {
    return skillTypeIds
      .map(skillTypeId => skillTypes.find(skillType => skillType.id === skillTypeId))
      .filter((skillType): skillType is CreatedSongSkillType => skillType !== undefined);
  }
}

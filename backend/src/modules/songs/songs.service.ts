import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
import { SkillsService } from '../skills/skills.service';

import type { CreateSongInput } from './dto/create-song.dto';
import type { GetBandSongsQuery } from './dto/get-band-songs-query.dto';
import type { UpdateSongInput } from './dto/update-song.dto';
import { SONGS_REPOSITORY, type SongsRepository } from './repositories/songs.repository';
import type { CreateSongResult } from './types/create-song-result.type';
import type { DeleteSongResult } from './types/delete-song-result.type';
import type { GetBandSongsResult } from './types/song-list.type';
import type { UpdateSongResult } from './types/update-song-result.type';

@Injectable()
export class SongsService {
  constructor(
    @Inject(SONGS_REPOSITORY)
    private readonly songsRepository: SongsRepository,
    private readonly prisma: PrismaService,
    private readonly skillsService: SkillsService,
  ) {}

  /**
   * 밴드 멤버만 곡을 생성할 수 있으므로 멤버십과 세션 타입을 검증한 뒤 저장한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 곡을 추가할 밴드 ID
   * @param {CreateSongInput} input - 곡 생성 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateSongResult>} 생성된 곡 정보
   */
  async createSong(userId: string, bandId: string, input: CreateSongInput, tx?: Prisma.TransactionClient): Promise<CreateSongResult> {
    const createSong = async (client: Prisma.TransactionClient): Promise<CreateSongResult> => {
      const skillTypeIds = input.skillTypeIds ?? [];

      this.validateDuplicatedIds(skillTypeIds);

      const band = await this.songsRepository.findActiveBandWithMemberByBandIdAndUserId(bandId, userId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      if (band.member === null) {
        throw new ForbiddenException('밴드 멤버만 곡을 생성할 수 있습니다.');
      }

      await this.validateSkillTypes(skillTypeIds, client);

      return this.songsRepository.createSong(
        {
          ...input,
          bandId: band.id,
          userId,
          createdByBandMemberId: band.member.id,
          skillTypeIds,
        },
        client,
      );
    };

    if (tx !== undefined) {
      return createSong(tx);
    }

    return this.prisma.$transaction(createSong);
  }

  /**
   * 밴드 멤버만 밴드 곡 목록을 조회할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 조회할 밴드 ID
   * @param {GetBandSongsQuery} query - 검색어와 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetBandSongsResult>} 밴드 곡 목록
   */
  async getBandSongs(userId: string, bandId: string, query: GetBandSongsQuery, tx?: Prisma.TransactionClient): Promise<GetBandSongsResult> {
    this.validateSongListQuery(query);

    const band = await this.songsRepository.findActiveBandWithMemberByBandIdAndUserId(bandId, userId, tx);

    if (band === null) {
      throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
    }

    if (band.member === null) {
      throw new ForbiddenException('밴드 멤버만 곡 목록을 조회할 수 있습니다.');
    }

    return this.songsRepository.findBandSongs(band.id, query, tx);
  }

  /**
   * 밴드 멤버만 곡 기본 정보와 세션 타입 연결을 수정할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} songId - 수정할 곡 ID
   * @param {UpdateSongInput} input - 곡 수정 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateSongResult>} 수정된 곡 정보
   */
  async updateSong(userId: string, songId: string, input: UpdateSongInput, tx?: Prisma.TransactionClient): Promise<UpdateSongResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdateSongResult> => {
      this.validateUpdateSongInput(input);

      const song = await this.songsRepository.findSongWithBandMemberBySongIdAndUserId(songId, userId, client);

      if (song === null) {
        throw new NotFoundException('요청한 곡을 찾을 수 없습니다.');
      }

      if (song.member === null) {
        throw new ForbiddenException('밴드 멤버만 곡을 수정할 수 있습니다.');
      }

      if (input.skillTypeIds !== undefined) {
        this.validateDuplicatedIds(input.skillTypeIds);
        await this.validateSkillTypes(input.skillTypeIds, client);
      }

      return this.songsRepository.updateSong(song.id, input, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 밴드 멤버만 곡을 hard delete 할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} songId - 삭제할 곡 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeleteSongResult>} 삭제 처리 결과
   */
  async deleteSong(userId: string, songId: string, tx?: Prisma.TransactionClient): Promise<DeleteSongResult> {
    const run = async (client: Prisma.TransactionClient): Promise<DeleteSongResult> => {
      const song = await this.songsRepository.findSongWithBandMemberBySongIdAndUserId(songId, userId, client);

      if (song === null) {
        throw new NotFoundException('요청한 곡을 찾을 수 없습니다.');
      }

      if (song.member === null) {
        throw new ForbiddenException('밴드 멤버만 곡을 삭제할 수 있습니다.');
      }

      const deletedSong = await this.songsRepository.deleteSong(song.id, new Date(), client);

      if (deletedSong === undefined) {
        throw new NotFoundException('요청한 곡을 찾을 수 없습니다.');
      }

      return deletedSong;
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  private validateDuplicatedIds(ids: string[]): void {
    const uniqueIds = new Set(ids);

    if (uniqueIds.size !== ids.length) {
      throw new BadRequestException('중복된 세션이 포함되어 있습니다.');
    }
  }

  private async validateSkillTypes(skillTypeIds: string[], tx: Prisma.TransactionClient): Promise<void> {
    if (skillTypeIds.length === 0) {
      return;
    }

    const { skillTypeIds: existingSkillTypeIds } = await this.skillsService.findExistingSkillTypeIds(skillTypeIds, tx);

    if (existingSkillTypeIds.length !== skillTypeIds.length) {
      throw new BadRequestException('존재하지 않는 세션이 포함되어 있습니다.');
    }
  }

  private validateSongListQuery(query: GetBandSongsQuery): void {
    if (query.order__created_at !== query.order__id) {
      throw new BadRequestException('order__created_at과 order__id는 같은 방향이어야 합니다.');
    }
  }

  private validateUpdateSongInput(input: UpdateSongInput): void {
    const hasTitle = input.title !== undefined;
    const hasArtistName = input.artistName !== undefined;
    const hasSourceUrl = input.sourceUrl !== undefined;
    const hasSourceType = input.sourceType !== undefined;
    const hasMemo = input.memo !== undefined;
    const hasSkillTypeIds = input.skillTypeIds !== undefined;

    if (!hasTitle && !hasArtistName && !hasSourceUrl && !hasSourceType && !hasMemo && !hasSkillTypeIds) {
      throw new BadRequestException('수정할 곡 정보가 필요합니다.');
    }
  }
}

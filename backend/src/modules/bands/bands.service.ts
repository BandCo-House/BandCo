import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import { BandMemberRole, type Prisma } from '../../generated/prisma';

import type { CreateBandInput } from './dto/create-band.dto';
import type { GetBandMembersQuery } from './dto/get-band-members-query.dto';
import type { GetMyBandsQuery } from './dto/get-my-bands-query.dto';
import type { SearchBandsQuery } from './dto/search-bands-query.dto';
import type { UpdateBandMemberRoleInput } from './dto/update-band-member-role.dto';
import { BANDS_REPOSITORY, type BandsRepository } from './repositories/bands.repository';
import type { GetBandMembersResult } from './types/band-member-list.type';
import type { SearchBandsResult } from './types/band-search-result.type';
import type { CreateBandInvitationFailedItem, CreateBandResult } from './types/create-band-result.type';
import type { DeleteBandResult } from './types/delete-band-result.type';
import type { GetMyBandsResult } from './types/my-band-list.type';
import type { UpdateBandMemberRoleResult } from './types/update-band-member-role-result.type';

@Injectable()
export class BandsService {
  constructor(
    @Inject(BANDS_REPOSITORY) private readonly bandsRepository: BandsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 인증 사용자를 밴드장으로 삼아 밴드 생성 정책을 검증하고 저장을 위임한다.
   *
   * @param {string} bandMasterUserId - 인증된 사용자 ID
   * @param {CreateBandInput} input - 검증이 끝난 밴드 생성 요청값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateBandResult>} 밴드 생성 응답 데이터
   */
  async createBand(bandMasterUserId: string, input: CreateBandInput, tx?: Prisma.TransactionClient): Promise<CreateBandResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateBandResult> => {
      const genreIds = this.removeDuplicatedIds(input.genreIds ?? []);
      await this.validateGenres(genreIds, client);

      const inviteeUserIds = this.removeDuplicatedIds(input.inviteeUserIds ?? []);
      const invitationTarget = await this.createInvitationTarget(bandMasterUserId, inviteeUserIds, client);

      const result = await this.bandsRepository.createBand(
        {
          ...input,
          bandMasterUserId,
          genreIds,
          inviteeUserIds: invitationTarget.validUserIds,
        },
        client,
      );

      return {
        band: {
          ...result.band,
          invitations: {
            success: result.band.invitations.success,
            failed: invitationTarget.failedItems,
          },
        },
      };
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 밴드 하위 데이터를 보존하기 위해 deletedAt을 채워 삭제 상태로 표시한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 삭제할 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeleteBandResult>} 삭제 처리 결과
   */
  async deleteBand(userId: string, bandId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandResult> {
    const run = async (client: Prisma.TransactionClient): Promise<DeleteBandResult> => {
      const band = await this.bandsRepository.findBandForDelete(bandId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      if (band.bandMasterUserId !== userId) {
        throw new ForbiddenException('밴드 삭제 권한이 없습니다.');
      }

      return this.bandsRepository.deleteBand(bandId, new Date(), client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  /**
   * 인증 사용자가 멤버로 속한 삭제되지 않은 밴드 목록을 조회한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {GetMyBandsQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetMyBandsResult>} 내가 속한 밴드 목록
   */
  async getMyBands(userId: string, query: GetMyBandsQuery, tx?: Prisma.TransactionClient): Promise<GetMyBandsResult> {
    this.validateCursorPair(query);

    return this.bandsRepository.findMyBands(userId, query, tx);
  }

  /**
   * 밴드 멤버만 같은 밴드의 멤버 목록을 조회할 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} bandId - 조회할 밴드 ID
   * @param {GetBandMembersQuery} query - 정렬과 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetBandMembersResult>} 밴드 멤버 목록
   */
  async getBandMembers(
    requesterUserId: string,
    bandId: string,
    query: GetBandMembersQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetBandMembersResult> {
    this.validateBandMemberListQuery(query);

    const band = await this.bandsRepository.findBandForMemberList(bandId, requesterUserId, tx);

    if (band === null) {
      throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
    }

    if (band.requesterMemberId === null) {
      throw new ForbiddenException('밴드 멤버 조회 권한이 없습니다.');
    }

    return this.bandsRepository.findBandMembers(bandId, query, tx);
  }

  /**
   * 공개 밴드 검색은 인증 없이 이름 기준으로만 조회한다.
   *
   * @param {SearchBandsQuery} query - 검색어, 정렬, 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SearchBandsResult>} 공개 밴드 검색 결과
   */
  async searchBands(query: SearchBandsQuery, tx?: Prisma.TransactionClient): Promise<SearchBandsResult> {
    this.validateBandSearchQuery(query);

    return this.bandsRepository.searchBands(query, tx);
  }

  /**
   * 밴드장은 부리더와 일반 멤버 간 역할만 변경할 수 있다.
   *
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {string} bandId - 대상 밴드 ID
   * @param {string} targetUserId - 역할을 변경할 사용자 ID
   * @param {UpdateBandMemberRoleInput} input - 검증이 끝난 역할 변경 요청값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateBandMemberRoleResult>} 변경된 밴드 멤버 권한
   */
  async updateBandMemberRole(
    requesterUserId: string,
    bandId: string,
    targetUserId: string,
    input: UpdateBandMemberRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateBandMemberRoleResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdateBandMemberRoleResult> => {
      if (input.role === BandMemberRole.BM) {
        throw new BadRequestException('밴드장 권한은 이 API에서 부여할 수 없습니다.');
      }

      const band = await this.bandsRepository.findBandForMemberRoleUpdate(bandId, client);

      if (band === null) {
        throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
      }

      if (band.bandMasterUserId !== requesterUserId) {
        throw new ForbiddenException('밴드 멤버 권한 변경 권한이 없습니다.');
      }

      const member = await this.bandsRepository.findBandMemberForRoleUpdate(bandId, targetUserId, client);

      if (member === null) {
        throw new NotFoundException('요청한 밴드 멤버를 찾을 수 없습니다.');
      }

      return this.bandsRepository.updateBandMemberRole(member.id, input, client);
    };

    if (tx !== undefined) {
      return run(tx);
    }

    return this.prisma.$transaction(run);
  }

  private async validateGenres(genreIds: string[], tx: Prisma.TransactionClient): Promise<void> {
    if (genreIds.length === 0) {
      return;
    }

    const existingGenreIds = await this.bandsRepository.findExistingGenreIds(genreIds, tx);

    if (existingGenreIds.length !== genreIds.length) {
      throw new BadRequestException('존재하지 않는 장르가 포함되어 있습니다.');
    }
  }

  private async createInvitationTarget(
    bandMasterUserId: string,
    inviteeUserIds: string[],
    tx: Prisma.TransactionClient,
  ): Promise<{
    validUserIds: string[];
    failedItems: CreateBandInvitationFailedItem[];
  }> {
    if (inviteeUserIds.length === 0) {
      return {
        validUserIds: [],
        failedItems: [],
      };
    }

    const selfInviteeUserIds = inviteeUserIds.filter(userId => userId === bandMasterUserId);
    const userIdsToFind = inviteeUserIds.filter(userId => userId !== bandMasterUserId);
    const existingUserIds = await this.bandsRepository.findExistingUserIds(userIdsToFind, tx);
    const existingUserIdSet = new Set(existingUserIds);
    const validUserIds = userIdsToFind.filter(userId => existingUserIdSet.has(userId));
    const missingUserIds = userIdsToFind.filter(userId => !existingUserIdSet.has(userId));

    return {
      validUserIds,
      failedItems: [
        ...selfInviteeUserIds.map(userId => ({
          userId,
          reason: '밴드 생성자는 초대 대상이 될 수 없습니다.',
        })),
        ...missingUserIds.map(userId => ({
          userId,
          reason: '존재하지 않거나 비활성화된 사용자입니다.',
        })),
      ],
    };
  }

  private removeDuplicatedIds(ids: string[]): string[] {
    return [...new Set(ids)];
  }

  private validateCursorPair(query: GetMyBandsQuery): void {
    const hasCursorCreatedAt = query.cursor__created_at !== undefined;
    const hasCursorId = query.cursor__id !== undefined;

    if (hasCursorCreatedAt !== hasCursorId) {
      throw new BadRequestException('커서 조회에는 cursor__created_at과 cursor__id가 함께 필요합니다.');
    }

    if (query.cursor__created_at === undefined) {
      return;
    }

    const cursorCreatedAt = new Date(query.cursor__created_at);

    if (Number.isNaN(cursorCreatedAt.getTime())) {
      throw new BadRequestException('cursor__created_at은 유효한 날짜여야 합니다.');
    }
  }

  private validateBandMemberListQuery(query: GetBandMembersQuery): void {
    if (query.order__joined_at !== query.order__id) {
      throw new BadRequestException('order__joined_at과 order__id는 같은 방향이어야 합니다.');
    }

    const hasCursorJoinedAt = query.cursor__joined_at !== undefined;
    const hasCursorId = query.cursor__id !== undefined;

    if (hasCursorJoinedAt !== hasCursorId) {
      throw new BadRequestException('커서 조회에는 cursor__joined_at과 cursor__id가 함께 필요합니다.');
    }

    if (query.cursor__joined_at === undefined) {
      return;
    }

    const cursorJoinedAt = new Date(query.cursor__joined_at);

    if (Number.isNaN(cursorJoinedAt.getTime())) {
      throw new BadRequestException('cursor__joined_at은 유효한 날짜여야 합니다.');
    }
  }

  private validateBandSearchQuery(query: SearchBandsQuery): void {
    if (query.order__created_at !== query.order__id) {
      throw new BadRequestException('order__created_at과 order__id는 같은 방향이어야 합니다.');
    }

    const hasCursorCreatedAt = query.cursor__created_at !== undefined;
    const hasCursorId = query.cursor__id !== undefined;

    if (hasCursorCreatedAt !== hasCursorId) {
      throw new BadRequestException('커서 조회에는 cursor__created_at과 cursor__id가 함께 필요합니다.');
    }

    if (query.cursor__created_at === undefined) {
      return;
    }

    const cursorCreatedAt = new Date(query.cursor__created_at);

    if (Number.isNaN(cursorCreatedAt.getTime())) {
      throw new BadRequestException('cursor__created_at은 유효한 날짜여야 합니다.');
    }
  }
}

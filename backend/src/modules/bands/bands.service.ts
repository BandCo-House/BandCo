import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';

import type { CreateBandInput } from './dto/create-band.dto';
import { BANDS_REPOSITORY, type BandsRepository } from './repositories/bands.repository';
import type { CreateBandInvitationFailedItem, CreateBandResult } from './types/create-band-result.type';

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
}

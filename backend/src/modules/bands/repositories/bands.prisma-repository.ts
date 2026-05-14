import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { BandGenreItem, CreateBandInvitationSuccessItem } from '../types/create-band-result.type';

import type { BandsRepository, CreateBandRepositoryInput, CreateBandRepositoryResult } from './bands.repository';

@Injectable()
export class BandsPrismaRepository implements BandsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 상위 Service가 넘긴 트랜잭션이 있으면 같은 작업 단위 안에서 밴드를 생성한다.
   *
   * @param {CreateBandRepositoryInput} input - Service에서 정책 검증이 끝난 밴드 생성 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateBandRepositoryResult>} 생성된 밴드와 성공한 초대 목록
   */
  async createBand(input: CreateBandRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateBandRepositoryResult> {
    const client = tx ?? this.prisma;

    const band = await client.band.create({
      data: {
        name: input.name,
        description: input.description,
        visibility: input.visibility,
        coverImgUrl: input.coverImgUrl,
        bandMasterUserId: input.bandMasterUserId,
      },
    });

    const bandMasterMember = await client.bandMember.create({
      data: {
        bandId: band.id,
        userId: input.bandMasterUserId,
        role: 'BM',
      },
    });

    if (input.genreIds.length > 0) {
      await client.bandGenre.createMany({
        data: input.genreIds.map(genreId => ({
          bandId: band.id,
          genreId,
        })),
      });
    }

    const createdInvitations = await Promise.all(
      input.inviteeUserIds.map(inviteeUserId =>
        client.bandInvitation.create({
          data: {
            bandId: band.id,
            inviterBandMemberId: bandMasterMember.id,
            inviteeUserId,
          },
          select: {
            id: true,
            inviteeUserId: true,
          },
        }),
      ),
    );

    const genres = await client.genre.findMany({
      where: {
        id: {
          in: input.genreIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return {
      band: {
        id: band.id,
        name: band.name ?? input.name,
        description: band.description,
        visibility: band.visibility ?? input.visibility,
        coverImgUrl: band.coverImgUrl,
        genres: this.mapGenres(input.genreIds, genres),
        bandMasterUserId: band.bandMasterUserId,
        createdAt: band.createdAt.toISOString(),
        invitations: {
          success: this.mapInvitationSuccess(createdInvitations),
          failed: [],
        },
      },
    };
  }

  /**
   * 요청받은 장르 ID 중 DB에 실제 존재하는 ID만 조회한다.
   *
   * @param {string[]} genreIds - 확인할 장르 ID 목록
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<string[]>} 존재하는 장르 ID 목록
   */
  async findExistingGenreIds(genreIds: string[], tx?: Prisma.TransactionClient): Promise<string[]> {
    if (genreIds.length === 0) {
      return [];
    }

    const client = tx ?? this.prisma;

    const genres = await client.genre.findMany({
      where: {
        id: {
          in: genreIds,
        },
      },
      select: {
        id: true,
      },
    });

    return genres.map(genre => genre.id);
  }

  /**
   * 요청받은 사용자 ID 중 초대 대상으로 사용할 수 있는 활성 사용자 ID만 조회한다.
   *
   * @param {string[]} userIds - 확인할 사용자 ID 목록
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<string[]>} 존재하는 활성 사용자 ID 목록
   */
  async findExistingUserIds(userIds: string[], tx?: Prisma.TransactionClient): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const client = tx ?? this.prisma;

    const users = await client.user.findMany({
      where: {
        id: {
          in: userIds,
        },
        deletedAt: null,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    });

    return users.map(user => user.id);
  }

  private mapGenres(
    genreIds: string[],
    genres: {
      id: string;
      name: string | null;
    }[],
  ): BandGenreItem[] {
    return genreIds.flatMap(genreId => {
      const genre = genres.find(item => item.id === genreId);

      if (genre === undefined) {
        return [];
      }

      return [
        {
          id: genre.id,
          name: genre.name ?? '',
        },
      ];
    });
  }

  private mapInvitationSuccess(
    invitations: {
      id: string;
      inviteeUserId: string;
    }[],
  ): CreateBandInvitationSuccessItem[] {
    return invitations.map(invitation => ({
      userId: invitation.inviteeUserId,
      invitationId: invitation.id,
    }));
  }
}

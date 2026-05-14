import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { UpdateBandMemberRoleInput } from '../dto/update-band-member-role.dto';
import type { BandGenreItem, CreateBandInvitationSuccessItem } from '../types/create-band-result.type';
import type { DeleteBandResult } from '../types/delete-band-result.type';
import type { UpdateBandMemberRoleResult } from '../types/update-band-member-role-result.type';

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
   * 하위 데이터를 보존해야 하므로 Band.deletedAt만 채워 soft delete 한다.
   *
   * @param {string} bandId - 삭제할 밴드 ID
   * @param {Date} deletedAt - 삭제 처리 시각
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeleteBandResult>} 삭제 처리 결과
   */
  async deleteBand(bandId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<DeleteBandResult> {
    const client = tx ?? this.prisma;

    const deletedBand = await client.band.update({
      where: {
        id: bandId,
      },
      data: {
        deletedAt,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    return {
      bandId: deletedBand.id,
      deletedAt: (deletedBand.deletedAt ?? deletedAt).toISOString(),
    };
  }

  /**
   * 권한 변경 권한 판단에 필요한 최소 밴드 정보만 조회한다.
   *
   * @param {string} bandId - 확인할 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string; bandMasterUserId: string } | null>} 삭제되지 않은 밴드 정보
   */
  async findBandForMemberRoleUpdate(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandMasterUserId: string;
  } | null> {
    const client = tx ?? this.prisma;

    return client.band.findFirst({
      where: {
        id: bandId,
        deletedAt: null,
      },
      select: {
        id: true,
        bandMasterUserId: true,
      },
    });
  }

  /**
   * 권한을 변경할 밴드 멤버를 밴드와 사용자 기준으로 조회한다.
   *
   * @param {string} bandId - 대상 밴드 ID
   * @param {string} userId - 대상 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string; userId: string } | null>} 밴드 멤버 정보
   */
  async findBandMemberForRoleUpdate(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    userId: string;
  } | null> {
    const client = tx ?? this.prisma;

    return client.bandMember.findFirst({
      where: {
        bandId,
        userId,
      },
      select: {
        id: true,
        userId: true,
      },
    });
  }

  /**
   * 삭제 가능 여부 판단에 필요한 최소 밴드 정보만 조회한다.
   *
   * @param {string} bandId - 확인할 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string; bandMasterUserId: string } | null>} 삭제되지 않은 밴드 정보
   */
  async findBandForDelete(
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandMasterUserId: string;
  } | null> {
    const client = tx ?? this.prisma;

    return client.band.findFirst({
      where: {
        id: bandId,
        deletedAt: null,
      },
      select: {
        id: true,
        bandMasterUserId: true,
      },
    });
  }

  /**
   * 밴드 멤버 역할을 ADMIN 또는 MEMBER로 변경한다.
   *
   * @param {string} bandMemberId - 권한을 변경할 밴드 멤버 ID
   * @param {UpdateBandMemberRoleInput} input - 검증이 끝난 권한 변경 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateBandMemberRoleResult>} 변경된 밴드 멤버 권한
   */
  async updateBandMemberRole(
    bandMemberId: string,
    input: UpdateBandMemberRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateBandMemberRoleResult> {
    const client = tx ?? this.prisma;

    const member = await client.bandMember.update({
      where: {
        id: bandMemberId,
      },
      data: {
        role: input.role,
      },
      select: {
        userId: true,
        role: true,
      },
    });

    return {
      member: {
        userId: member.userId,
        role: member.role,
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

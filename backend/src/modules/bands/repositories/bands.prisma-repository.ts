import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../database/prisma';
import type { BandMemberRole, Prisma } from '../../../generated/prisma';
import type { BandMemberOrderDirection, GetBandMembersQuery } from '../dto/get-band-members-query.dto';
import type { GetMyBandsQuery } from '../dto/get-my-bands-query.dto';
import type { BandSearchOrderDirection, SearchBandsQuery } from '../dto/search-bands-query.dto';
import type { UpdateBandInput } from '../dto/update-band.dto';
import type { UpdateBandMemberRoleInput } from '../dto/update-band-member-role.dto';
import type { BandMemberListItem, GetBandMembersResult } from '../types/band-member-list.type';
import type { BandSearchListItem, SearchBandsResult } from '../types/band-search-result.type';
import type { BandGenreItem, CreateBandInvitationSuccessItem } from '../types/create-band-result.type';
import type { DeleteBandResult } from '../types/delete-band-result.type';
import type { LeaveBandResult } from '../types/leave-band-result.type';
import type { GetMyBandsResult, MyBandListItem } from '../types/my-band-list.type';
import type { UpdateBandMemberRoleResult } from '../types/update-band-member-role-result.type';
import type { UpdateBandResult } from '../types/update-band-result.type';

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
   * 밴드 나가기 정책 판단에 필요한 밴드와 요청자 멤버 정보를 조회한다.
   *
   * @param {string} bandId - 나갈 밴드 ID
   * @param {string} userId - 인증된 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string; member: { id: string; role: BandMemberRole } | null } | null>} 삭제되지 않은 밴드와 요청자 멤버 정보
   */
  async findBandForLeave(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    member: {
      id: string;
      role: BandMemberRole;
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
            role: true,
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
   * BandMember에는 탈퇴 시각 컬럼이 없으므로 멤버십 row를 삭제한다.
   *
   * @param {string} bandMemberId - 삭제할 밴드 멤버 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<LeaveBandResult>} 삭제된 멤버십의 밴드와 사용자 ID
   */
  async leaveBand(bandMemberId: string, tx?: Prisma.TransactionClient): Promise<LeaveBandResult> {
    const client = tx ?? this.prisma;

    const deletedMember = await client.bandMember.delete({
      where: {
        id: bandMemberId,
      },
      select: {
        bandId: true,
        userId: true,
      },
    });

    return {
      bandId: deletedMember.bandId,
      userId: deletedMember.userId,
    };
  }

  /**
   * 밴드 존재 여부와 요청자의 밴드 멤버 여부 판단에 필요한 정보만 조회한다.
   *
   * @param {string} bandId - 조회할 밴드 ID
   * @param {string} requesterUserId - 인증된 사용자 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string; requesterMemberId: string | null } | null>} 삭제되지 않은 밴드와 요청자 멤버 ID
   */
  async findBandForMemberList(
    bandId: string,
    requesterUserId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    requesterMemberId: string | null;
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
            userId: requesterUserId,
          },
          select: {
            id: true,
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
      requesterMemberId: band.members[0]?.id ?? null,
    };
  }

  /**
   * 밴드 멤버를 가입 시점과 ID 기준으로 정렬해 조회한다.
   *
   * @param {string} bandId - 조회할 밴드 ID
   * @param {GetBandMembersQuery} query - 정렬과 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetBandMembersResult>} 밴드 멤버 목록
   */
  async findBandMembers(bandId: string, query: GetBandMembersQuery, tx?: Prisma.TransactionClient): Promise<GetBandMembersResult> {
    const client = tx ?? this.prisma;

    const bandMembers = await client.bandMember.findMany({
      where: {
        bandId,
        user: {
          deletedAt: null,
        },
        ...this.createBandMembersCursorWhere(query),
      },
      include: {
        user: {
          include: {
            profile: {
              select: {
                nickname: true,
                avatarUrl: true,
              },
            },
            userSkills: {
              include: {
                skillType: {
                  select: {
                    name: true,
                  },
                },
              },
              orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }, { id: 'asc' }],
            },
          },
        },
      },
      orderBy: [{ joinedAt: query.order__joined_at }, { id: query.order__id }],
      take: query.take,
    });

    const members = bandMembers.map(member => this.mapBandMemberListItem(member));
    const count = members.length;
    const cursor = count > 0 ? { joinedAt: members[0].joinedAt, id: members[0].bandMemberId } : null;
    const next = count === query.take ? { joinedAt: members[count - 1].joinedAt, id: members[count - 1].bandMemberId } : null;

    return {
      bandId,
      members,
      meta: {
        count,
        take: query.take,
        cursor,
        next,
      },
    };
  }

  /**
   * 공개 밴드를 이름 기준으로 검색한다.
   *
   * @param {SearchBandsQuery} query - 검색어, 정렬, 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<SearchBandsResult>} 공개 밴드 검색 결과
   */
  async searchBands(query: SearchBandsQuery, tx?: Prisma.TransactionClient): Promise<SearchBandsResult> {
    const client = tx ?? this.prisma;

    const bands = await client.band.findMany({
      where: {
        deletedAt: null,
        visibility: true,
        ...this.createBandSearchKeywordWhere(query),
        ...this.createBandSearchCursorWhere(query),
      },
      include: {
        bandMasterUser: {
          include: {
            profile: {
              select: {
                nickname: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: [{ createdAt: query.order__created_at }, { id: query.order__id }],
      take: query.take,
    });

    const items = bands.map(band => this.mapBandSearchListItem(band));
    const count = items.length;
    const cursor = count > 0 ? { createdAt: items[0].createdAt, id: items[0].bandId } : null;
    const next = count === query.take ? { createdAt: items[count - 1].createdAt, id: items[count - 1].bandId } : null;

    return {
      keyword: query.where__name__contain ?? null,
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
   * 권한 판단에 필요한 삭제되지 않은 밴드 정보를 조회한다.
   *
   * @param {string} bandId - 확인할 밴드 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<{ id: string; bandMasterUserId: string } | null>} 삭제되지 않은 밴드 정보
   */
  async findActiveBandById(
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
   * 밴드장 변경과 장르 변경을 제외한 기본 정보만 수정한다.
   *
   * @param {string} bandId - 수정할 밴드 ID
   * @param {UpdateBandInput} input - Service 검증이 끝난 수정 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateBandResult>} 수정된 밴드 정보
   */
  async updateBand(bandId: string, input: UpdateBandInput, tx?: Prisma.TransactionClient): Promise<UpdateBandResult> {
    const client = tx ?? this.prisma;

    const updatedBand = await client.band.update({
      where: {
        id: bandId,
      },
      data: this.createUpdateBandData(input),
      select: {
        id: true,
        name: true,
        description: true,
        visibility: true,
        coverImgUrl: true,
        updatedAt: true,
      },
    });

    return {
      bandId: updatedBand.id,
      name: updatedBand.name ?? '',
      description: updatedBand.description,
      visibility: updatedBand.visibility ?? true,
      coverImgUrl: updatedBand.coverImgUrl,
      updatedAt: updatedBand.updatedAt.toISOString(),
    };
  }

  /**
   * 사용자가 멤버로 속한 삭제되지 않은 밴드를 고정 정렬 기준으로 조회한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {GetMyBandsQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetMyBandsResult>} 내가 속한 밴드 목록
   */
  async findMyBands(userId: string, query: GetMyBandsQuery, tx?: Prisma.TransactionClient): Promise<GetMyBandsResult> {
    const client = tx ?? this.prisma;

    const bands = await client.band.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId,
          },
        },
        ...this.createMyBandsCursorWhere(query),
      },
      include: {
        members: {
          where: {
            userId,
          },
          select: {
            role: true,
            joinedAt: true,
          },
          take: 1,
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.take,
    });

    const items = bands.flatMap(band => this.mapMyBandListItem(band));
    const count = items.length;
    const cursor = count > 0 ? { createdAt: items[0].createdAt, id: items[0].id } : null;
    const next = count === query.take ? { createdAt: items[count - 1].createdAt, id: items[count - 1].id } : null;

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

  private createMyBandsCursorWhere(query: GetMyBandsQuery): Prisma.BandWhereInput {
    if (query.cursor__created_at === undefined || query.cursor__id === undefined) {
      return {};
    }

    const cursorCreatedAt = new Date(query.cursor__created_at);

    return {
      OR: [
        {
          createdAt: {
            lt: cursorCreatedAt,
          },
        },
        {
          createdAt: cursorCreatedAt,
          id: {
            lt: query.cursor__id,
          },
        },
      ],
    };
  }

  private createBandMembersCursorWhere(query: GetBandMembersQuery): Prisma.BandMemberWhereInput {
    if (query.cursor__joined_at === undefined || query.cursor__id === undefined) {
      return {};
    }

    const cursorJoinedAt = new Date(query.cursor__joined_at);
    const cursorOperator = this.getCursorOperator(query.order__joined_at);

    return {
      OR: [
        {
          joinedAt: {
            [cursorOperator]: cursorJoinedAt,
          },
        },
        {
          joinedAt: cursorJoinedAt,
          id: {
            [cursorOperator]: query.cursor__id,
          },
        },
      ],
    };
  }

  private createBandSearchKeywordWhere(query: SearchBandsQuery): Prisma.BandWhereInput {
    if (query.where__name__contain === undefined) {
      return {};
    }

    return {
      name: {
        contains: query.where__name__contain,
        mode: 'insensitive',
      },
    };
  }

  private createBandSearchCursorWhere(query: SearchBandsQuery): Prisma.BandWhereInput {
    if (query.cursor__created_at === undefined || query.cursor__id === undefined) {
      return {};
    }

    const cursorCreatedAt = new Date(query.cursor__created_at);
    const cursorOperator = this.getBandSearchCursorOperator(query.order__created_at);

    return {
      OR: [
        {
          createdAt: {
            [cursorOperator]: cursorCreatedAt,
          },
        },
        {
          createdAt: cursorCreatedAt,
          id: {
            [cursorOperator]: query.cursor__id,
          },
        },
      ],
    };
  }

  private createUpdateBandData(input: UpdateBandInput): Prisma.BandUpdateInput {
    const data: Prisma.BandUpdateInput = {};

    if (input.name !== undefined) {
      data.name = input.name;
    }

    if (input.description !== undefined) {
      data.description = input.description;
    }

    if (input.visibility !== undefined) {
      data.visibility = input.visibility;
    }

    if (input.coverImgUrl !== undefined) {
      data.coverImgUrl = input.coverImgUrl;
    }

    return data;
  }

  private getCursorOperator(orderDirection: BandMemberOrderDirection): 'lt' | 'gt' {
    if (orderDirection === 'desc') {
      return 'lt';
    }

    return 'gt';
  }

  private getBandSearchCursorOperator(orderDirection: BandSearchOrderDirection): 'lt' | 'gt' {
    if (orderDirection === 'desc') {
      return 'lt';
    }

    return 'gt';
  }

  private mapBandMemberListItem(
    member: Prisma.BandMemberGetPayload<{
      include: {
        user: {
          include: {
            profile: {
              select: {
                nickname: true;
                avatarUrl: true;
              };
            };
            userSkills: {
              include: {
                skillType: {
                  select: {
                    name: true;
                  };
                };
              };
            };
          };
        };
      };
    }>,
  ): BandMemberListItem {
    return {
      bandMemberId: member.id,
      userId: member.userId,
      nickname: member.user.profile?.nickname ?? '',
      avatarUrl: member.user.profile?.avatarUrl ?? null,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      skills: member.user.userSkills.map(skill => ({
        skillTypeId: skill.skillTypeId,
        skillName: skill.skillType.name,
        skillLevel: skill.skillLevel,
        isPrimary: skill.isPrimary,
      })),
    };
  }

  private mapBandSearchListItem(
    band: Prisma.BandGetPayload<{
      include: {
        bandMasterUser: {
          include: {
            profile: {
              select: {
                nickname: true;
              };
            };
          };
        };
        _count: {
          select: {
            members: true;
          };
        };
      };
    }>,
  ): BandSearchListItem {
    return {
      bandId: band.id,
      name: band.name ?? '',
      description: band.description,
      visibility: band.visibility ?? true,
      memberCount: band._count.members,
      bandMaster: {
        userId: band.bandMasterUserId,
        nickname: band.bandMasterUser.profile?.nickname ?? '',
      },
      createdAt: band.createdAt.toISOString(),
    };
  }

  private mapMyBandListItem(
    band: Prisma.BandGetPayload<{
      include: {
        members: {
          select: {
            role: true;
            joinedAt: true;
          };
        };
        _count: {
          select: {
            members: true;
          };
        };
      };
    }>,
  ): MyBandListItem[] {
    const myMember = band.members[0];

    if (myMember === undefined) {
      return [];
    }

    return [
      {
        id: band.id,
        name: band.name ?? '',
        description: band.description,
        visibility: band.visibility ?? true,
        myRole: myMember.role,
        joinedAt: myMember.joinedAt.toISOString(),
        createdAt: band.createdAt.toISOString(),
        memberCount: band._count.members,
      },
    ];
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

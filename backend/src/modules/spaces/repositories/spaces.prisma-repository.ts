import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { createPagination } from '../../../common/pagination';
import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { AddSpaceMemberInput } from '../dto/add-space-member.dto';
import type { CreateBandSpaceInput } from '../dto/create-band-space.dto';
import type { GetBandSpacesQuery } from '../dto/get-band-spaces-query.dto';
import type { UpdateBandSpaceInput } from '../dto/update-band-space.dto';
import type { UpdateSpaceMemberRoleInput } from '../dto/update-space-member-role.dto';
import type { BandSpaceListItem, GetBandSpacesResult, SpaceMemberRole } from '../types/band-space-list-item.type';
import type { CreateBandSpaceResult } from '../types/create-band-space-result.type';
import type { DeleteBandSpaceResult } from '../types/delete-band-space-result.type';
import type { GetSpaceDetailResult, SpaceMemberDetail } from '../types/space-detail.type';
import type { UpdateBandSpaceResult } from '../types/update-band-space-result.type';

import type { AddSpaceMemberRepositoryResult, SpacesRepository, UpdateSpaceMemberRoleRepositoryResult } from './spaces.repository';

const DEMO_BAND_MEMBER_ID = '11111111-1111-1111-1111-111111111111';

type BandSpaceListRecord = Prisma.BandSpaceGetPayload<{
  include: {
    band: {
      select: {
        _count: {
          select: {
            songs: true;
          };
        };
      };
    };
    members: {
      where: {
        bandMemberId: string;
      };
      select: {
        role: true;
      };
    };
    _count: {
      select: {
        members: true;
      };
    };
  };
}>;

type BandSpaceDetailRecord = Prisma.BandSpaceGetPayload<{
  include: {
    band: {
      select: {
        _count: {
          select: {
            songs: true;
          };
        };
      };
    };
    members: {
      include: {
        bandMember: {
          include: {
            user: {
              include: {
                profile: {
                  select: {
                    nickname: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    schedules: true;
  };
}>;

@Injectable()
export class SpacesPrismaRepository implements SpacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addSpaceMember(spaceId: string, input: AddSpaceMemberInput): Promise<AddSpaceMemberRepositoryResult> {
    const [space, bandMember, existingMember] = await Promise.all([
      this.prisma.bandSpace.findFirst({
        where: {
          id: spaceId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      }),
      this.prisma.bandMember.findUnique({
        where: {
          id: input.bandMemberId,
        },
        select: {
          id: true,
          userId: true,
        },
      }),
      this.prisma.spaceMember.findFirst({
        where: {
          bandSpaceId: spaceId,
          bandMemberId: input.bandMemberId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (space === null) {
      throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');
    }

    if (bandMember === null) {
      throw new NotFoundException('추가할 밴드 멤버를 찾을 수 없습니다.');
    }

    if (existingMember !== null) {
      throw new ConflictException('이미 합주 공간에 참여 중인 멤버입니다.');
    }

    const createdMember = await this.prisma.spaceMember.create({
      data: {
        bandSpaceId: spaceId,
        bandMemberId: input.bandMemberId,
        role: input.role,
        status: 'ACTIVE',
      },
    });

    return {
      memberId: createdMember.id,
      spaceId: createdMember.bandSpaceId,
      userId: bandMember.userId,
      bandMemberId: createdMember.bandMemberId,
      role: createdMember.role,
      status: createdMember.status,
      joinedAt: createdMember.joinedAt.toISOString(),
      spaceName: space.name,
    };
  }

  async createBandSpace(bandId: string, input: CreateBandSpaceInput): Promise<CreateBandSpaceResult> {
    const band = await this.prisma.band.findFirst({
      where: {
        id: bandId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (band === null) {
      throw new NotFoundException('요청한 밴드를 찾을 수 없습니다.');
    }

    const createdSpace = await this.prisma.$transaction(async transaction => {
      const bandSpace = await transaction.bandSpace.create({
        data: {
          bandId,
          name: input.name,
          description: input.description,
          spaceType: input.spaceType,
          status: input.status,
          startDate: new Date(`${input.startDate}T00:00:00.000Z`),
          endDate: new Date(`${input.endDate}T00:00:00.000Z`),
          createdByBandMemberId: DEMO_BAND_MEMBER_ID,
        },
      });

      await transaction.spaceMember.create({
        data: {
          bandSpaceId: bandSpace.id,
          bandMemberId: DEMO_BAND_MEMBER_ID,
          role: 'LEADER',
          status: 'ACTIVE',
        },
      });

      return bandSpace;
    });

    return {
      spaceId: createdSpace.id,
      bandId: createdSpace.bandId,
      name: createdSpace.name,
      description: createdSpace.description ?? '',
      spaceType: createdSpace.spaceType ?? 'ONLINE',
      status: createdSpace.status,
      startDate: this.formatDateOnly(createdSpace.startDate),
      endDate: this.formatDateOnly(createdSpace.endDate),
      createdByBandMemberId: createdSpace.createdByBandMemberId,
      createdAt: createdSpace.createdAt.toISOString(),
    };
  }

  async findBandSpaces(bandId: string, query: GetBandSpacesQuery): Promise<GetBandSpacesResult> {
    const where = this.createBandSpaceWhereInput(bandId, query);
    const orderBy = this.createBandSpaceOrderByInput(query.sort);
    const skip = (query.page - 1) * query.size;

    const [totalCount, spaces] = await Promise.all([
      this.prisma.bandSpace.count({
        where,
      }),
      this.prisma.bandSpace.findMany({
        where,
        orderBy,
        skip,
        take: query.size,
        include: {
          band: {
            select: {
              _count: {
                select: {
                  songs: true,
                },
              },
            },
          },
          members: {
            where: {
              bandMemberId: DEMO_BAND_MEMBER_ID,
            },
            select: {
              role: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
    ]);

    return {
      items: spaces.map(space => this.mapBandSpaceListItem(space)),
      pagination: createPagination(totalCount, {
        page: query.page,
        size: query.size,
      }),
    };
  }

  async findDetailBySpaceId(spaceId: string): Promise<GetSpaceDetailResult | undefined> {
    const space = await this.prisma.bandSpace.findFirst({
      where: {
        id: spaceId,
        deletedAt: null,
      },
      include: {
        band: {
          select: {
            _count: {
              select: {
                songs: true,
              },
            },
          },
        },
        members: {
          include: {
            bandMember: {
              include: {
                user: {
                  include: {
                    profile: {
                      select: {
                        nickname: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        schedules: true,
      },
    });

    if (space === null) {
      return undefined;
    }

    return this.mapBandSpaceDetail(space);
  }

  private createBandSpaceWhereInput(bandId: string, query: GetBandSpacesQuery): Prisma.BandSpaceWhereInput {
    const where: Prisma.BandSpaceWhereInput = {
      bandId,
      deletedAt: null,
    };

    if (query.query !== undefined) {
      where.OR = [
        {
          name: {
            contains: query.query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query.query,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (query.onlyMine === true) {
      where.createdByBandMemberId = DEMO_BAND_MEMBER_ID;
    }

    if (query.inProgressOnly === true) {
      where.status = 'ACTIVE';
    }

    return where;
  }

  private createBandSpaceOrderByInput(sort: string | undefined): Prisma.BandSpaceOrderByWithRelationInput[] {
    if (sort === 'createdAt,asc') {
      return [{ createdAt: 'asc' }];
    }

    if (sort === 'name,asc') {
      return [{ name: 'asc' }, { createdAt: 'desc' }];
    }

    if (sort === 'name,desc') {
      return [{ name: 'desc' }, { createdAt: 'desc' }];
    }

    return [{ createdAt: 'desc' }];
  }

  private mapBandSpaceListItem(space: BandSpaceListRecord): BandSpaceListItem {
    const myMembership = space.members[0];

    return {
      spaceId: space.id,
      bandId: space.bandId,
      createdByBandMemberId: space.createdByBandMemberId,
      name: space.name,
      description: space.description ?? '',
      spaceType: space.spaceType ?? 'ONLINE',
      status: space.status,
      startDate: this.formatDateOnly(space.startDate),
      endDate: this.formatDateOnly(space.endDate),
      memberCount: space._count.members,
      songCount: space.band._count.songs,
      isMine: space.createdByBandMemberId === DEMO_BAND_MEMBER_ID,
      myMembership: {
        isMember: myMembership !== undefined,
        role: this.normalizeSpaceMemberRole(myMembership?.role),
      },
      createdAt: space.createdAt.toISOString(),
      updatedAt: this.formatDateTime(space.updatedAt, space.createdAt),
    };
  }

  private mapBandSpaceDetail(space: BandSpaceDetailRecord): GetSpaceDetailResult {
    const sortedMembers = [...space.members].sort((leftMember, rightMember) => {
      const leftPriority = leftMember.role === 'LEADER' ? 0 : 1;
      const rightPriority = rightMember.role === 'LEADER' ? 0 : 1;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      return leftMember.joinedAt.getTime() - rightMember.joinedAt.getTime();
    });

    return {
      space: {
        spaceId: space.id,
        bandId: space.bandId,
        name: space.name,
        description: space.description ?? '',
        spaceType: space.spaceType ?? 'ONLINE',
        status: space.status,
        startDate: this.formatDateOnly(space.startDate),
        endDate: this.formatDateOnly(space.endDate),
        createdAt: space.createdAt.toISOString(),
        updatedAt: this.formatDateTime(space.updatedAt, space.createdAt),
      },
      members: sortedMembers.map(member => this.mapSpaceMemberDetail(member)),
      songCount: space.band._count.songs,
      scheduleCount: space.schedules.length,
    };
  }

  private mapSpaceMemberDetail(member: BandSpaceDetailRecord['members'][number]): SpaceMemberDetail {
    return {
      bandMemberId: member.bandMemberId,
      nickname: member.bandMember.user.profile?.nickname ?? '알 수 없는 사용자',
      role: this.normalizeSpaceMemberRole(member.role),
      status: member.status,
      joinedAt: member.joinedAt.toISOString(),
    };
  }

  private formatDateOnly(value: Date | null): string {
    if (value === null) {
      return '';
    }

    return value.toISOString().slice(0, 10);
  }

  private formatDateTime(value: Date | null, fallbackValue: Date): string {
    if (value === null) {
      return fallbackValue.toISOString();
    }

    return value.toISOString();
  }

  private normalizeSpaceMemberRole(role: SpaceMemberRole | null | undefined): SpaceMemberRole {
    if (role === undefined || role === null) {
      return 'MEMBER';
    }

    return role;
  }

  async findBandMemberUserIds(bandId: string, tx?: Prisma.TransactionClient): Promise<string[]> {
    const client = tx ?? this.prisma;
    const members = await client.bandMember.findMany({
      where: { bandId },
      select: { userId: true },
    });
    return members.map(m => m.userId);
  }

  async updateBandSpace(spaceId: string, input: UpdateBandSpaceInput, tx?: Prisma.TransactionClient): Promise<UpdateBandSpaceResult> {
    const client = tx ?? this.prisma;

    const space = await client.bandSpace.findFirst({
      where: { id: spaceId, deletedAt: null },
      select: { id: true },
    });

    if (space === null) {
      throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');
    }

    const now = new Date();

    const updated = await client.bandSpace.update({
      where: { id: spaceId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.spaceType !== undefined && { spaceType: input.spaceType }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.startDate !== undefined && { startDate: new Date(`${input.startDate}T00:00:00.000Z`) }),
        ...(input.endDate !== undefined && { endDate: new Date(`${input.endDate}T00:00:00.000Z`) }),
        updatedAt: now,
      },
    });

    return {
      spaceId: updated.id,
      bandId: updated.bandId,
      name: updated.name,
      description: updated.description ?? '',
      spaceType: updated.spaceType ?? 'ONLINE',
      status: updated.status,
      startDate: this.formatDateOnly(updated.startDate),
      endDate: this.formatDateOnly(updated.endDate),
      updatedAt: now.toISOString(),
    };
  }

  async deleteBandSpace(spaceId: string, tx?: Prisma.TransactionClient): Promise<DeleteBandSpaceResult> {
    const client = tx ?? this.prisma;

    const space = await client.bandSpace.findFirst({
      where: { id: spaceId, deletedAt: null },
      select: { id: true },
    });

    if (space === null) {
      throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');
    }

    const now = new Date();

    await client.bandSpace.update({
      where: { id: spaceId },
      data: { deletedAt: now },
    });

    return { spaceId, deletedAt: now.toISOString() };
  }

  async updateSpaceMemberRole(
    spaceId: string,
    memberId: string,
    input: UpdateSpaceMemberRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateSpaceMemberRoleRepositoryResult> {
    const client = tx ?? this.prisma;

    const spaceMember = await client.spaceMember.findFirst({
      where: { id: memberId, bandSpaceId: spaceId },
      include: {
        bandSpace: { select: { name: true } },
        bandMember: { select: { userId: true } },
      },
    });

    if (spaceMember === null) {
      throw new NotFoundException('합주 공간 멤버를 찾을 수 없습니다.');
    }

    const now = new Date();

    await client.spaceMember.update({
      where: { id: memberId },
      data: { role: input.role },
    });

    return {
      memberId,
      spaceId,
      userId: spaceMember.bandMember.userId,
      bandMemberId: spaceMember.bandMemberId,
      role: input.role,
      spaceName: spaceMember.bandSpace.name,
      updatedAt: now.toISOString(),
    };
  }
}

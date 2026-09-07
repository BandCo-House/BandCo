import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { createPagination } from '../../../common/pagination';
import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { AddBandSpaceMemberInput } from '../dto/add-bandspace-member.dto';
import type { CreateBandSpaceInput } from '../dto/create-band-space.dto';
import type { GetBandSpacesQuery } from '../dto/get-band-spaces-query.dto';
import type { UpdateBandSpaceInput } from '../dto/update-band-space.dto';
import type { UpdateBandSpaceMemberRoleInput } from '../dto/update-bandspace-member-role.dto';
import type { BandSpaceListItem, GetBandSpacesResult, SpaceMemberRole } from '../types/band-space-list-item.type';
import type { BandSpaceMemberDetail, GetBandSpaceDetailResult } from '../types/bandspace-detail.type';
import type { CreateBandSpaceResult } from '../types/create-band-space-result.type';
import type { DeleteBandSpaceResult } from '../types/delete-band-space-result.type';
import type { UpdateBandSpaceResult } from '../types/update-band-space-result.type';

import type {
  AddBandSpaceMemberRepositoryResult,
  BandSpacesRepository,
  RemoveBandSpaceMemberRepositoryResult,
  UpdateBandSpaceMemberRoleRepositoryResult,
} from './bandspaces.repository';

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
export class BandSpacesPrismaRepository implements BandSpacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addBandSpaceMember(
    spaceId: string,
    input: AddBandSpaceMemberInput,
    tx?: Prisma.TransactionClient,
  ): Promise<AddBandSpaceMemberRepositoryResult> {
    const client = tx ?? this.prisma;
    const [space, bandMember, existingMember] = await Promise.all([
      client.bandSpace.findFirst({
        where: {
          id: spaceId,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
        },
      }),
      client.bandMember.findUnique({
        where: {
          id: input.bandMemberId,
        },
        select: {
          id: true,
          userId: true,
        },
      }),
      client.spaceMember.findFirst({
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

    const createdMember = await client.spaceMember.create({
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

  /** 요청자 밴드 멤버를 생성자이자 LEADER 멤버로 기록한다. 밴드 존재·멤버십 확인은 Service가 같은 tx 안에서 끝낸다. */
  async createBandSpace(
    bandId: string,
    requesterBandMemberId: string,
    input: CreateBandSpaceInput,
    tx?: Prisma.TransactionClient,
  ): Promise<CreateBandSpaceResult> {
    const run = async (client: Prisma.TransactionClient) => {
      const bandSpace = await client.bandSpace.create({
        data: {
          bandId,
          name: input.name,
          description: input.description,
          spaceType: input.spaceType,
          status: input.status,
          startDate: new Date(`${input.startDate}T00:00:00.000Z`),
          endDate: new Date(`${input.endDate}T00:00:00.000Z`),
          createdByBandMemberId: requesterBandMemberId,
        },
      });

      await client.spaceMember.create({
        data: {
          bandSpaceId: bandSpace.id,
          bandMemberId: requesterBandMemberId,
          role: 'LEADER',
          status: 'ACTIVE',
        },
      });

      return bandSpace;
    };

    const createdSpace = tx ? await run(tx) : await this.prisma.$transaction(run);

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

  async findBandSpaces(
    bandId: string,
    requesterBandMemberId: string,
    query: GetBandSpacesQuery,
    tx?: Prisma.TransactionClient,
  ): Promise<GetBandSpacesResult> {
    const client = tx ?? this.prisma;
    const where = this.createBandSpaceWhereInput(bandId, requesterBandMemberId, query);
    const orderBy = this.createBandSpaceOrderByInput(query.sort);
    const skip = (query.page - 1) * query.size;

    const [totalCount, spaces] = await Promise.all([
      client.bandSpace.count({
        where,
      }),
      client.bandSpace.findMany({
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
              bandMemberId: requesterBandMemberId,
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
      items: spaces.map(space => this.mapBandSpaceListItem(space, requesterBandMemberId)),
      pagination: createPagination(totalCount, {
        page: query.page,
        size: query.size,
      }),
    };
  }

  async findDetailByBandSpaceId(spaceId: string, tx?: Prisma.TransactionClient): Promise<GetBandSpaceDetailResult | undefined> {
    const client = tx ?? this.prisma;
    const space = await client.bandSpace.findFirst({
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

  private createBandSpaceWhereInput(bandId: string, requesterBandMemberId: string, query: GetBandSpacesQuery): Prisma.BandSpaceWhereInput {
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
      where.createdByBandMemberId = requesterBandMemberId;
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

  private mapBandSpaceListItem(space: BandSpaceListRecord, requesterBandMemberId: string): BandSpaceListItem {
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
      isMine: space.createdByBandMemberId === requesterBandMemberId,
      myMembership: {
        isMember: myMembership !== undefined,
        role: this.normalizeSpaceMemberRole(myMembership?.role),
      },
      createdAt: space.createdAt.toISOString(),
      updatedAt: this.formatDateTime(space.updatedAt, space.createdAt),
    };
  }

  private mapBandSpaceDetail(space: BandSpaceDetailRecord): GetBandSpaceDetailResult {
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
      members: sortedMembers.map(member => this.mapBandSpaceMemberDetail(member)),
      songCount: space.band._count.songs,
      scheduleCount: space.schedules.length,
    };
  }

  private mapBandSpaceMemberDetail(member: BandSpaceDetailRecord['members'][number]): BandSpaceMemberDetail {
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

  async findBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;
    return client.band.findFirst({
      where: { id: bandId, deletedAt: null },
      select: { id: true },
    });
  }

  async findBandMemberByBandIdAndUserId(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null> {
    const client = tx ?? this.prisma;
    return client.bandMember.findFirst({
      where: { bandId, userId, band: { deletedAt: null } },
      select: { id: true },
    });
  }

  async findBandIdBySpaceId(spaceId: string, tx?: Prisma.TransactionClient): Promise<string | null> {
    const client = tx ?? this.prisma;
    const space = await client.bandSpace.findFirst({
      where: { id: spaceId, deletedAt: null },
      select: { bandId: true },
    });
    return space?.bandId ?? null;
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

  async updateBandSpaceMemberRole(
    spaceId: string,
    memberId: string,
    input: UpdateBandSpaceMemberRoleInput,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateBandSpaceMemberRoleRepositoryResult> {
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

  async removeBandSpaceMember(spaceId: string, memberId: string, tx?: Prisma.TransactionClient): Promise<RemoveBandSpaceMemberRepositoryResult> {
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

    await client.spaceMember.delete({ where: { id: memberId } });

    const now = new Date();

    return {
      memberId,
      spaceId,
      recipientUserId: spaceMember.bandMember.userId,
      spaceName: spaceMember.bandSpace.name,
      removedAt: now.toISOString(),
    };
  }
}

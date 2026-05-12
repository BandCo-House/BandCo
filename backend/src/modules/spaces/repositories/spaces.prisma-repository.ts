import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { createPagination } from '../../../common/pagination';
import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { AddSpaceMemberInput } from '../dto/add-space-member.dto';
import type { CreateBandSpaceInput } from '../dto/create-band-space.dto';
import type { GetBandSpacesQuery } from '../dto/get-band-spaces-query.dto';
import type { AddSpaceMemberResult } from '../types/add-space-member-result.type';
import type { BandSpaceListItem, GetBandSpacesResult, SpaceMemberRole } from '../types/band-space-list-item.type';
import type { CreateBandSpaceResult } from '../types/create-band-space-result.type';
import type { GetSpaceDetailResult, SpaceMemberDetail } from '../types/space-detail.type';

import type { SpacesRepository } from './spaces.repository';

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

  async addSpaceMember(spaceId: string, input: AddSpaceMemberInput): Promise<AddSpaceMemberResult> {
    const [space, bandMember, existingMember] = await Promise.all([
      this.prisma.bandSpace.findFirst({
        where: {
          id: spaceId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      }),
      this.prisma.bandMember.findUnique({
        where: {
          id: input.bandMemberId,
        },
        select: {
          id: true,
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
      bandMemberId: createdMember.bandMemberId,
      role: createdMember.role,
      status: createdMember.status,
      joinedAt: createdMember.joinedAt.toISOString(),
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
}

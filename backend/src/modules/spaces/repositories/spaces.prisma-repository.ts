import { Injectable, NotFoundException } from '@nestjs/common';

import { createPagination } from '../../../common/pagination';
import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { CreateBandSpaceInput } from '../dto/create-band-space.dto';
import type { GetBandSpacesQuery } from '../dto/get-band-spaces-query.dto';
import type { BandSpaceListItem, GetBandSpacesResult, SpaceMemberRole } from '../types/band-space-list-item.type';
import type { CreateBandSpaceResult } from '../types/create-band-space-result.type';
import type { GetSpaceDetailResult, SpaceMemberDetail } from '../types/space-detail.type';

import type { SpacesRepository } from './spaces.repository';

const DEMO_VIEWER_USER_ID = '11111111-1111-1111-1111-111111111111';

type BandSpaceListRecord = Prisma.BandSpaceGetPayload<{
  include: {
    members: {
      where: {
        userId: string;
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
    schedules: {
      select: {
        targetTeams: {
          select: {
            _count: {
              select: {
                teamSongs: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type BandSpaceDetailRecord = Prisma.BandSpaceGetPayload<{
  include: {
    members: {
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
    schedules: {
      select: {
        targetTeams: {
          select: {
            _count: {
              select: {
                teamSongs: true;
              };
            };
          };
        };
      };
    };
  };
}>;

/**
 * 인증이 아직 붙지 않은 단계에서는 데모 사용자 하나를 기준으로
 * onlyMine, myMembership 응답을 고정해 두어 프론트와 API 확인이 가능하게 한다.
 */
@Injectable()
export class SpacesPrismaRepository implements SpacesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 밴드 아래에 새 합주 공간을 만들고,
   * 생성자를 기본 리더 멤버로 함께 연결한다.
   *
   * @param {string} bandId - 공간을 만들 대상 밴드 ID
   * @param {CreateBandSpaceInput} input - 검증이 끝난 생성 요청값
   * @returns {Promise<CreateBandSpaceResult>} 생성 응답 데이터
   */
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
          createdByUserId: DEMO_VIEWER_USER_ID,
        },
      });

      await transaction.spaceMember.create({
        data: {
          spaceId: bandSpace.id,
          userId: DEMO_VIEWER_USER_ID,
          role: 'LEADER',
          status: 'ACTIVE',
        },
      });

      return bandSpace;
    });

    return {
      spaceId: createdSpace.id,
      bandId: createdSpace.bandId,
      name: createdSpace.name ?? '',
      description: createdSpace.description ?? '',
      spaceType: createdSpace.spaceType ?? 'ETC',
      status: createdSpace.status ?? 'INACTIVE',
      startDate: this.formatDateOnly(createdSpace.startDate),
      endDate: this.formatDateOnly(createdSpace.endDate),
      createdByUserId: createdSpace.createdByUserId,
      createdAt: createdSpace.createdAt.toISOString(),
    };
  }

  /**
   * 밴드 소속 합주 공간 목록을 실제 DB에서 조회하고,
   * 현재 화면이 기대하는 응답 형태로 매핑한다.
   *
   * @param {string} bandId - 조회 대상 밴드 ID
   * @param {GetBandSpacesQuery} query - 검색, 정렬, 페이지네이션 조건
   * @returns {Promise<GetBandSpacesResult>} 목록 응답 데이터
   */
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
          members: {
            where: {
              userId: DEMO_VIEWER_USER_ID,
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
          schedules: {
            select: {
              targetTeams: {
                select: {
                  _count: {
                    select: {
                      teamSongs: true,
                    },
                  },
                },
              },
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

  /**
   * 합주 공간 상세와 멤버 목록을 함께 조회한다.
   *
   * @param {string} spaceId - 조회할 합주 공간 ID
   * @returns {Promise<GetSpaceDetailResult | undefined>} 상세 응답 또는 undefined
   */
  async findDetailBySpaceId(spaceId: string): Promise<GetSpaceDetailResult | undefined> {
    const space = await this.prisma.bandSpace.findFirst({
      where: {
        id: spaceId,
        deletedAt: null,
      },
      include: {
        members: {
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
        schedules: {
          select: {
            targetTeams: {
              select: {
                _count: {
                  select: {
                    teamSongs: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (space === null) {
      return undefined;
    }

    return this.mapBandSpaceDetail(space);
  }

  /**
   * 서비스가 넘겨준 검색 조건을 Prisma where 조건으로 변환한다.
   *
   * @param {string} bandId - 조회 대상 밴드 ID
   * @param {GetBandSpacesQuery} query - 검색, 상태, 생성자 조건
   * @returns {Prisma.BandSpaceWhereInput} Prisma 조회 조건
   */
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
      where.createdByUserId = DEMO_VIEWER_USER_ID;
    }

    if (query.inProgressOnly === true) {
      where.status = 'ACTIVE';
    }

    return where;
  }

  /**
   * 허용한 정렬 옵션만 DB 정렬로 바꾼다.
   *
   * @param {string | undefined} sort - 요청 정렬 문자열
   * @returns {Prisma.BandSpaceOrderByWithRelationInput[]} Prisma orderBy 배열
   */
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

  /**
   * DB 레코드를 목록 응답 DTO로 변환한다.
   *
   * @param {BandSpaceListRecord} space - Prisma 조회 결과
   * @returns {BandSpaceListItem} API 응답용 목록 아이템
   */
  private mapBandSpaceListItem(space: BandSpaceListRecord): BandSpaceListItem {
    const myMembership = space.members[0];

    return {
      spaceId: space.id,
      bandId: space.bandId,
      createdByUserId: space.createdByUserId,
      name: space.name ?? '',
      description: space.description ?? '',
      spaceType: space.spaceType ?? 'ETC',
      status: space.status ?? 'INACTIVE',
      startDate: this.formatDateOnly(space.startDate),
      endDate: this.formatDateOnly(space.endDate),
      memberCount: space._count.members,
      songCount: this.calculateSongCount(space.schedules),
      isMine: space.createdByUserId === DEMO_VIEWER_USER_ID,
      myMembership: {
        isMember: myMembership !== undefined,
        role: this.normalizeSpaceMemberRole(myMembership?.role),
      },
      createdAt: space.createdAt.toISOString(),
      updatedAt: this.formatDateTime(space.updatedAt, space.createdAt),
    };
  }

  /**
   * DB 레코드를 상세 응답 DTO로 변환한다.
   *
   * @param {BandSpaceDetailRecord} space - Prisma 조회 결과
   * @returns {GetSpaceDetailResult} API 응답용 상세 데이터
   */
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
        name: space.name ?? '',
        description: space.description ?? '',
        spaceType: space.spaceType ?? 'ETC',
        status: space.status ?? 'INACTIVE',
        startDate: this.formatDateOnly(space.startDate),
        endDate: this.formatDateOnly(space.endDate),
        createdAt: space.createdAt.toISOString(),
        updatedAt: this.formatDateTime(space.updatedAt, space.createdAt),
      },
      members: sortedMembers.map(member => this.mapSpaceMemberDetail(member)),
      songCount: this.calculateSongCount(space.schedules),
      scheduleCount: space.schedules.length,
    };
  }

  /**
   * 멤버 상세 응답에서 화면에 필요한 정보만 추려낸다.
   *
   * @param {BandSpaceDetailRecord['members'][number]} member - 공간 멤버 조회 결과
   * @returns {SpaceMemberDetail} API 응답용 멤버 정보
   */
  private mapSpaceMemberDetail(member: BandSpaceDetailRecord['members'][number]): SpaceMemberDetail {
    return {
      userId: member.userId,
      nickname: member.user.profile?.nickname ?? '알 수 없는 사용자',
      role: this.normalizeSpaceMemberRole(member.role),
      status: member.status,
      joinedAt: member.joinedAt.toISOString(),
    };
  }

  /**
   * 공간 아래 일정과 팀을 따라가며 화면에서 보여 줄 곡 수를 계산한다.
   *
   * 현재 스키마에는 공간과 곡이 직접 연결되어 있지 않기 때문에
   * 일정 -> 대상 팀 -> 팀 곡 개수 합산 방식으로 우선 정리한다.
   *
   * @param {Array<{ targetTeams: Array<{ _count: { teamSongs: number } }> }>} schedules - 일정 목록
   * @returns {number} 합산된 곡 수
   */
  private calculateSongCount(schedules: Array<{ targetTeams: Array<{ _count: { teamSongs: number } }> }>): number {
    return schedules.reduce((spaceSongCount, schedule) => {
      const scheduleSongCount = schedule.targetTeams.reduce((teamSongCount, team) => teamSongCount + team._count.teamSongs, 0);

      return spaceSongCount + scheduleSongCount;
    }, 0);
  }

  /**
   * Date 타입 컬럼을 화면에서 쓰는 yyyy-mm-dd 문자열로 고정한다.
   *
   * @param {Date | null} value - DB에서 읽은 날짜 값
   * @returns {string} 날짜 문자열
   */
  private formatDateOnly(value: Date | null): string {
    if (value === null) {
      return '';
    }

    return value.toISOString().slice(0, 10);
  }

  /**
   * 업데이트 시간이 없으면 생성 시간을 대신 써서 응답 스펙을 유지한다.
   *
   * @param {Date | null} value - 수정 시간
   * @param {Date} fallbackValue - 대체할 생성 시간
   * @returns {string} ISO 날짜 문자열
   */
  private formatDateTime(value: Date | null, fallbackValue: Date): string {
    if (value === null) {
      return fallbackValue.toISOString();
    }

    return value.toISOString();
  }

  /**
   * 멤버 정보가 없을 때도 응답 타입을 깨지 않도록 기본 역할을 맞춘다.
   *
   * @param {SpaceMemberRole | null | undefined} role - DB에서 읽은 역할
   * @returns {SpaceMemberRole} 응답에 사용할 역할
   */
  private normalizeSpaceMemberRole(role: SpaceMemberRole | null | undefined): SpaceMemberRole {
    if (role === undefined || role === null) {
      return 'MEMBER';
    }

    return role;
  }
}

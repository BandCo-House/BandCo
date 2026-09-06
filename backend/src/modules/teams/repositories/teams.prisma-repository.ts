import { Injectable } from '@nestjs/common';

import { parseToPrismaQuery } from '../../../common/query';
import { buildNextPath } from '../../../common/url';
import { PrismaService } from '../../../database/prisma';
import type { Prisma } from '../../../generated/prisma';
import type { GetBandTeamsQuery } from '../dto/get-band-teams-query.dto';
import type { GetMyTeamsQuery } from '../dto/get-my-teams-query.dto';
import type { GetTeamMembersQuery } from '../dto/get-team-members-query.dto';
import type { UpdateTeamInput } from '../dto/update-team.dto';
import type { AddTeamMemberResult } from '../types/add-team-member-result.type';
import type { ChangeTeamLeaderResult } from '../types/change-team-leader-result.type';
import type { CreateTeamResult } from '../types/create-team-result.type';
import type { DeleteTeamResult } from '../types/delete-team-result.type';
import type { BandTeamListItem, GetBandTeamsResult } from '../types/get-band-teams-result.type';
import type { GetMyTeamsResult, MyTeamListItem } from '../types/get-my-teams-result.type';
import type { GetTeamMembersResult, TeamMemberListItem } from '../types/get-team-members-result.type';
import type { GetTeamResult } from '../types/get-team-result.type';
import type { RemoveTeamMemberResult } from '../types/remove-team-member-result.type';
import type { UpdateTeamResult } from '../types/update-team-result.type';

import type { CreateTeamRepositoryInput, TeamsRepository } from './teams.repository';

@Injectable()
export class TeamsPrismaRepository implements TeamsRepository {
  constructor(private readonly prisma: PrismaService) {}

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
      where: { bandId, userId },
      select: { id: true },
    });
  }

  async findBandMemberById(bandMemberId: string, tx?: Prisma.TransactionClient): Promise<{ id: string; bandId: string } | null> {
    const client = tx ?? this.prisma;
    return client.bandMember.findUnique({
      where: { id: bandMemberId },
      select: { id: true, bandId: true },
    });
  }

  /**
   * 팀 생성과 동시에 팀 리더 TeamMember를 삽입한다.
   * 두 쿼리를 트랜잭션으로 묶어 정합성을 보장한다.
   *
   * @param {CreateTeamRepositoryInput} input - 팀 생성 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateTeamResult>} 생성된 팀 정보
   */
  async createTeam(input: CreateTeamRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateTeamResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateTeamResult> => {
      const team = await client.team.create({
        data: {
          bandId: input.bandId,
          name: input.name,
          description: input.description,
          teamCoverUrl: input.teamCoverUrl,
          teamLeaderBandMemberId: input.teamLeaderBandMemberId,
        },
        select: {
          id: true,
          bandId: true,
          name: true,
          description: true,
          status: true,
          teamLeaderBandMemberId: true,
          teamCoverUrl: true,
          createdAt: true,
        },
      });

      await client.teamMember.create({
        data: {
          teamId: team.id,
          bandMemberId: input.teamLeaderBandMemberId,
          teamRole: 'LEADER',
        },
      });

      return {
        teamId: team.id,
        bandId: team.bandId,
        name: team.name,
        description: team.description,
        status: team.status,
        teamLeaderUserId: input.teamLeaderUserId,
        teamCoverUrl: team.teamCoverUrl,
        createdAt: team.createdAt.toISOString(),
      };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 밴드에 속한 팀 목록을 createdAt + id 커서 기반으로 조회한다.
   *
   * @param {string} bandId - 대상 밴드 ID
   * @param {GetBandTeamsQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetBandTeamsResult>} 밴드 팀 목록
   */
  async findBandTeams(bandId: string, query: GetBandTeamsQuery, tx?: Prisma.TransactionClient): Promise<GetBandTeamsResult> {
    const client = tx ?? this.prisma;
    const { orderBy } = parseToPrismaQuery(query);

    const teams = await client.team.findMany({
      where: {
        bandId,
        ...this.createBandTeamsCursorWhere(query),
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        teamCoverUrl: true,
        createdAt: true,
        teamLeaderBandMember: {
          select: {
            userId: true,
            user: {
              select: {
                profile: {
                  select: { nickname: true },
                },
              },
            },
          },
        },
        // _count는 TeamMember 행 수라 세션 편성이 붙으면 겸업자가 여러 번 세어진다.
        // 사람 수가 필요하므로 bandMemberId만 받아 중복을 제거한다.
        members: { select: { bandMemberId: true } },
      },
      orderBy,
      take: query.take + 1,
    });

    const hasNext = teams.length > query.take;
    const rows = hasNext ? teams.slice(0, query.take) : teams;
    const items: BandTeamListItem[] = rows.map(team => ({
      teamId: team.id,
      name: team.name,
      description: team.description,
      status: team.status,
      teamCoverUrl: team.teamCoverUrl,
      memberCount: this.countDistinctMembers(team.members),
      teamLeader: team.teamLeaderBandMember
        ? {
            userId: team.teamLeaderBandMember.userId,
            nickname: team.teamLeaderBandMember.user?.profile?.nickname ?? '',
          }
        : null,
      createdAt: team.createdAt.toISOString(),
    }));

    const count = items.length;
    const cursor = count > 0 ? { createdAt: items[0].createdAt, id: rows[0].id } : null;
    const lastItem = items[count - 1];
    const next =
      hasNext && lastItem
        ? buildNextPath(`/bands/${bandId}/teams`, {
            cursor__created_at: lastItem.createdAt,
            cursor__id: rows[count - 1].id,
            take: query.take,
            order__created_at: query.order__created_at,
            order__id: query.order__id,
          })
        : null;

    return {
      bandId,
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
   * 팀 상세 정보를 조회한다. 팀 리더·멤버 수 포함.
   *
   * @param {string} teamId - 조회할 팀 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetTeamResult | null>} 팀 상세 정보
   */
  async findTeamById(teamId: string, tx?: Prisma.TransactionClient): Promise<GetTeamResult | null> {
    const client = tx ?? this.prisma;

    const team = await client.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        bandId: true,
        name: true,
        description: true,
        status: true,
        teamCoverUrl: true,
        createdAt: true,
        updatedAt: true,
        teamLeaderBandMember: {
          select: {
            userId: true,
            user: {
              select: {
                profile: {
                  select: { nickname: true },
                },
              },
            },
          },
        },
        // _count는 TeamMember 행 수라 세션 편성이 붙으면 겸업자가 여러 번 세어진다.
        // 사람 수가 필요하므로 bandMemberId만 받아 중복을 제거한다.
        members: { select: { bandMemberId: true } },
      },
    });

    if (!team) return null;

    return {
      teamId: team.id,
      bandId: team.bandId,
      name: team.name,
      description: team.description,
      status: team.status,
      teamCoverUrl: team.teamCoverUrl,
      teamLeader: team.teamLeaderBandMember
        ? {
            userId: team.teamLeaderBandMember.userId,
            nickname: team.teamLeaderBandMember.user?.profile?.nickname ?? '',
          }
        : null,
      memberCount: this.countDistinctMembers(team.members),
      createdAt: team.createdAt.toISOString(),
      updatedAt: team.updatedAt.toISOString(),
    };
  }

  async findTeamForUpdate(
    teamId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; bandId: string; teamLeaderBandMemberId: string | null } | null> {
    const client = tx ?? this.prisma;
    return client.team.findUnique({
      where: { id: teamId },
      select: { id: true, bandId: true, teamLeaderBandMemberId: true },
    });
  }

  async findTeamMemberByTeamAndBandMember(
    teamId: string,
    bandMemberId: string,
    skillTypeId?: string | null,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; teamRole: string } | null> {
    const client = tx ?? this.prisma;
    // 한 사람이 팀 안에서 여러 세션을 맡을 수 있어 (팀, 멤버)는 더 이상 유일하지 않다.
    // 세션까지 같아야 같은 배정으로 본다.
    return client.teamMember.findFirst({
      where: { teamId, bandMemberId, skillTypeId: skillTypeId ?? null },
      select: { id: true, teamRole: true },
    });
  }

  async findTeamMemberById(
    teamMemberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string; teamId: string; bandMemberId: string; teamRole: string } | null> {
    const client = tx ?? this.prisma;
    return client.teamMember.findUnique({
      where: { id: teamMemberId },
      select: { id: true, teamId: true, bandMemberId: true, teamRole: true },
    });
  }

  async updateTeam(teamId: string, input: UpdateTeamInput, tx?: Prisma.TransactionClient): Promise<UpdateTeamResult> {
    const client = tx ?? this.prisma;

    const team = await client.team.update({
      where: { id: teamId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.teamCoverUrl !== undefined && { teamCoverUrl: input.teamCoverUrl }),
      },
      select: {
        id: true,
        bandId: true,
        name: true,
        description: true,
        status: true,
        teamCoverUrl: true,
        updatedAt: true,
        teamLeaderBandMember: {
          select: {
            userId: true,
            user: {
              select: {
                profile: { select: { nickname: true } },
              },
            },
          },
        },
        members: { select: { bandMemberId: true } },
      },
    });

    return {
      teamId: team.id,
      bandId: team.bandId,
      name: team.name,
      description: team.description,
      status: team.status,
      teamCoverUrl: team.teamCoverUrl,
      teamLeader: team.teamLeaderBandMember
        ? {
            userId: team.teamLeaderBandMember.userId,
            nickname: team.teamLeaderBandMember.user?.profile?.nickname ?? '',
          }
        : null,
      memberCount: this.countDistinctMembers(team.members),
      updatedAt: team.updatedAt.toISOString(),
    };
  }

  /**
   * 팀 멤버 목록을 joinedAt + id 커서 기반으로 조회한다.
   *
   * @param {string} teamId - 대상 팀 ID
   * @param {GetTeamMembersQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetTeamMembersResult>} 팀 멤버 목록
   */
  async findTeamMembers(teamId: string, query: GetTeamMembersQuery, tx?: Prisma.TransactionClient): Promise<GetTeamMembersResult> {
    const client = tx ?? this.prisma;
    const { orderBy } = parseToPrismaQuery(query);

    const teamMembers = await client.teamMember.findMany({
      where: {
        teamId,
        ...this.createTeamMembersCursorWhere(query),
      },
      select: {
        id: true,
        bandMemberId: true,
        teamRole: true,
        joinedAt: true,
        skillType: { select: { id: true, name: true } },
        bandMember: {
          select: {
            userId: true,
            user: {
              select: {
                profile: {
                  select: { nickname: true, avatarUrl: true },
                },
                userSkills: {
                  select: {
                    skillTypeId: true,
                    skillLevel: true,
                    isPrimary: true,
                    skillType: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy,
      take: query.take + 1,
    });

    const hasNext = teamMembers.length > query.take;
    const rows = hasNext ? teamMembers.slice(0, query.take) : teamMembers;
    const items: TeamMemberListItem[] = rows.map(member => ({
      teamMemberId: member.id,
      bandMemberId: member.bandMemberId,
      skillType: member.skillType ? { skillTypeId: member.skillType.id, name: member.skillType.name } : null,
      user: {
        userId: member.bandMember.userId,
        nickname: member.bandMember.user?.profile?.nickname ?? '',
        profileImageUrl: member.bandMember.user?.profile?.avatarUrl ?? null,
      },
      teamRole: member.teamRole,
      joinedAt: member.joinedAt.toISOString(),
      skills:
        member.bandMember.user?.userSkills?.map(s => ({
          skillTypeId: s.skillTypeId,
          skillName: s.skillType.name,
          skillLevel: s.skillLevel,
          isPrimary: s.isPrimary,
        })) ?? [],
    }));

    const count = items.length;
    const cursor = count > 0 ? { joinedAt: items[0].joinedAt, id: rows[0].id } : null;
    const lastItem = items[count - 1];
    const next =
      hasNext && lastItem
        ? buildNextPath(`/teams/${teamId}/members`, {
            cursor__joined_at: lastItem.joinedAt,
            cursor__id: rows[count - 1].id,
            take: query.take,
            order__joined_at: query.order__joined_at,
            order__id: query.order__id,
          })
        : null;

    return {
      teamId,
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
   * 기존 리더의 teamRole을 MEMBER로 낮추고 새 리더를 LEADER로 승격한다.
   * Team.teamLeaderBandMemberId도 동시에 갱신한다.
   *
   * @param {string} teamId - 대상 팀 ID
   * @param {string} newLeaderTeamMemberId - 새 리더가 될 TeamMember ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ChangeTeamLeaderResult>} 변경 결과
   */
  async changeTeamLeader(teamId: string, newLeaderTeamMemberId: string, tx?: Prisma.TransactionClient): Promise<ChangeTeamLeaderResult> {
    const run = async (client: Prisma.TransactionClient): Promise<ChangeTeamLeaderResult> => {
      await client.teamMember.updateMany({
        where: { teamId, teamRole: 'LEADER' },
        data: { teamRole: 'MEMBER' },
      });

      // teamRole은 사람 단위 속성인데 행은 세션마다 나뉜다. 지정된 한 행만 올리면
      // 겸업하는 리더가 LEADER 행과 MEMBER 행을 동시에 갖게 되고, 어느 행을 먼저
      // 읽느냐에 따라 역할이 뒤집힌다. 그 사람의 행을 전부 올린다.
      const target = await client.teamMember.findUnique({
        where: { id: newLeaderTeamMemberId },
        select: { bandMemberId: true },
      });

      if (target !== null) {
        await client.teamMember.updateMany({
          where: { teamId, bandMemberId: target.bandMemberId },
          data: { teamRole: 'LEADER' },
        });
      }

      const newLeaderMember = await client.teamMember.findUnique({
        where: { id: newLeaderTeamMemberId },
        select: {
          bandMemberId: true,
          bandMember: {
            select: {
              userId: true,
              user: {
                select: {
                  profile: { select: { nickname: true } },
                },
              },
            },
          },
        },
      });

      await client.team.update({
        where: { id: teamId },
        data: { teamLeaderBandMemberId: newLeaderMember!.bandMemberId },
      });

      return {
        teamId,
        teamLeader: {
          userId: newLeaderMember!.bandMember.userId,
          nickname: newLeaderMember!.bandMember.user?.profile?.nickname ?? '',
        },
      };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  async countTeamMemberAssignments(teamId: string, bandMemberId: string, tx?: Prisma.TransactionClient): Promise<number> {
    const client = tx ?? this.prisma;
    return client.teamMember.count({ where: { teamId, bandMemberId } });
  }

  async removeTeamMember(teamMemberId: string, teamId: string, tx?: Prisma.TransactionClient): Promise<RemoveTeamMemberResult> {
    const client = tx ?? this.prisma;

    await client.teamMember.delete({
      where: { id: teamMemberId },
    });

    return { teamMemberId, removed: true };
  }

  /**
   * 사용자가 속한 팀 목록을 joinedAt + id 커서 기반으로 조회한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {GetMyTeamsQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetMyTeamsResult>} 내가 속한 팀 목록
   */
  async findMyTeams(userId: string, query: GetMyTeamsQuery, tx?: Prisma.TransactionClient): Promise<GetMyTeamsResult> {
    const client = tx ?? this.prisma;
    const { orderBy } = parseToPrismaQuery(query);

    // 세션 편성이 붙으면 한 팀에 대한 TeamMember 행이 여러 개다. 그냥 두면 같은 팀이
    // 목록에 두 번 나온다. 메모리에서 접으면 take+1로 다음 페이지를 판별하는 규칙이
    // 깨지므로(접힌 만큼 줄어 hasNext가 false가 된다) DB에서 팀 단위로 자른다.
    const myTeamMembers = await client.teamMember.findMany({
      where: {
        bandMember: { userId },
        ...this.createMyTeamsCursorWhere(query),
      },
      distinct: ['teamId'],
      select: {
        id: true,
        teamRole: true,
        joinedAt: true,
        team: {
          select: {
            id: true,
            bandId: true,
            band: { select: { name: true } },
            name: true,
            description: true,
            status: true,
            teamCoverUrl: true,
            createdAt: true,
            teamLeaderBandMember: {
              select: {
                userId: true,
                user: {
                  select: {
                    profile: { select: { nickname: true } },
                  },
                },
              },
            },
            members: {
              select: { bandMemberId: true, teamRole: true, bandMember: { select: { userId: true } } },
            },
          },
        },
      },
      orderBy,
      take: query.take + 1,
    });

    const hasNext = myTeamMembers.length > query.take;
    const rows = hasNext ? myTeamMembers.slice(0, query.take) : myTeamMembers;
    const items: MyTeamListItem[] = rows.map(member => ({
      teamId: member.team.id,
      bandId: member.team.bandId,
      bandName: member.team.band.name ?? '',
      name: member.team.name,
      description: member.team.description,
      status: member.team.status,
      teamCoverUrl: member.team.teamCoverUrl,
      // distinct가 남긴 행이 꼭 리더 행은 아니다. 겸업하는 리더가 MEMBER로 뜨지 않게
      // 그 팀에 있는 내 행 전체를 보고 판단한다.
      myTeamRole: this.resolveMyTeamRole(member.team.members, userId, member.teamRole),
      memberCount: this.countDistinctMembers(member.team.members),
      teamLeader: member.team.teamLeaderBandMember
        ? {
            userId: member.team.teamLeaderBandMember.userId,
            nickname: member.team.teamLeaderBandMember.user?.profile?.nickname ?? '',
          }
        : null,
      joinedAt: member.joinedAt.toISOString(),
      createdAt: member.team.createdAt.toISOString(),
    }));

    const count = items.length;
    const cursor = count > 0 ? { joinedAt: items[0].joinedAt, id: rows[0].id } : null;
    const lastItem = items[count - 1];
    const next =
      hasNext && lastItem
        ? buildNextPath(`/teams/me`, {
            cursor__joined_at: lastItem.joinedAt,
            cursor__id: rows[count - 1].id,
            take: query.take,
            order__joined_at: query.order__joined_at,
            order__id: query.order__id,
          })
        : null;

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

  async addTeamMember(
    teamId: string,
    bandMemberId: string,
    skillTypeId?: string | null,
    tx?: Prisma.TransactionClient,
  ): Promise<AddTeamMemberResult> {
    const client = tx ?? this.prisma;

    const teamMember = await client.teamMember.create({
      data: {
        teamId,
        bandMemberId,
        teamRole: 'MEMBER',
        skillTypeId: skillTypeId ?? null,
      },
      select: {
        id: true,
        teamId: true,
        bandMemberId: true,
        teamRole: true,
        joinedAt: true,
        skillType: { select: { id: true, name: true } },
        bandMember: {
          select: {
            userId: true,
            user: {
              select: {
                profile: { select: { nickname: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    return {
      teamMemberId: teamMember.id,
      teamId: teamMember.teamId,
      bandMemberId: teamMember.bandMemberId,
      user: {
        userId: teamMember.bandMember.userId,
        nickname: teamMember.bandMember.user?.profile?.nickname ?? '',
        profileImageUrl: teamMember.bandMember.user?.profile?.avatarUrl ?? null,
      },
      teamRole: teamMember.teamRole,
      joinedAt: teamMember.joinedAt.toISOString(),
      skillType: teamMember.skillType ? { skillTypeId: teamMember.skillType.id, name: teamMember.skillType.name } : null,
    };
  }

  /**
   * 팀 멤버 행에서 사람 수를 센다.
   * 세션 편성 때문에 한 사람이 여러 행으로 나뉘므로 행 수를 그대로 쓰면 안 된다.
   *
   * @param {{ bandMemberId: string }[]} members - 팀 멤버 행 목록
   * @returns {number} 중복을 제거한 사람 수
   */
  private countDistinctMembers(members: { bandMemberId: string }[]): number {
    return new Set(members.map(member => member.bandMemberId)).size;
  }

  /**
   * 팀 안에서 내 역할을 고른다. 세션마다 행이 나뉘어 같은 사람이 LEADER 행과
   * MEMBER 행을 함께 가질 수 있으므로 LEADER가 하나라도 있으면 그것을 택한다.
   *
   * @param {{ teamRole: string; bandMember: { userId: string } }[]} members - 팀 멤버 행 목록
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} fallback - 내 행을 못 찾았을 때 쓸 값
   * @returns {string} 팀에서의 내 역할
   */
  private resolveMyTeamRole(members: { teamRole: string; bandMember: { userId: string } }[], userId: string, fallback: string): string {
    const mine = members.filter(member => member.bandMember.userId === userId);
    if (mine.length === 0) return fallback;
    return mine.some(member => member.teamRole === 'LEADER') ? 'LEADER' : mine[0].teamRole;
  }

  async findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<string[]> {
    const client = tx ?? this.prisma;
    if (skillTypeIds.length === 0) return [];
    const rows = await client.skillType.findMany({
      where: { id: { in: skillTypeIds } },
      select: { id: true },
    });
    return rows.map(row => row.id);
  }

  async deleteTeam(teamId: string, tx?: Prisma.TransactionClient): Promise<DeleteTeamResult> {
    const client = tx ?? this.prisma;

    await client.team.delete({ where: { id: teamId } });

    return { teamId, deleted: true };
  }

  private createBandTeamsCursorWhere(query: GetBandTeamsQuery): Prisma.TeamWhereInput {
    if (query.cursor__created_at === undefined || query.cursor__id === undefined) {
      return {};
    }

    const cursorCreatedAt = new Date(query.cursor__created_at);
    const tsOp = query.order__created_at === 'asc' ? 'gt' : 'lt';
    const idOp = query.order__id === 'asc' ? 'gt' : 'lt';

    return {
      OR: [
        { createdAt: { [tsOp]: cursorCreatedAt } },
        {
          createdAt: cursorCreatedAt,
          id: { [idOp]: query.cursor__id },
        },
      ],
    };
  }

  private createTeamMembersCursorWhere(query: GetTeamMembersQuery): Prisma.TeamMemberWhereInput {
    if (query.cursor__joined_at === undefined || query.cursor__id === undefined) {
      return {};
    }

    const cursorJoinedAt = new Date(query.cursor__joined_at);
    const tsOp = query.order__joined_at === 'asc' ? 'gt' : 'lt';
    const idOp = query.order__id === 'asc' ? 'gt' : 'lt';

    return {
      OR: [
        { joinedAt: { [tsOp]: cursorJoinedAt } },
        {
          joinedAt: cursorJoinedAt,
          id: { [idOp]: query.cursor__id },
        },
      ],
    };
  }

  private createMyTeamsCursorWhere(query: GetMyTeamsQuery): Prisma.TeamMemberWhereInput {
    if (query.cursor__joined_at === undefined || query.cursor__id === undefined) {
      return {};
    }

    const cursorJoinedAt = new Date(query.cursor__joined_at);
    const tsOp = query.order__joined_at === 'asc' ? 'gt' : 'lt';
    const idOp = query.order__id === 'asc' ? 'gt' : 'lt';

    return {
      OR: [
        { joinedAt: { [tsOp]: cursorJoinedAt } },
        {
          joinedAt: cursorJoinedAt,
          id: { [idOp]: query.cursor__id },
        },
      ],
    };
  }
}

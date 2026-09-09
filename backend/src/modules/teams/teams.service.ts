import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import { Prisma } from '../../generated/prisma';

import type { ChangeTeamLeaderBodyDto } from './dto/change-team-leader.dto';
import type { CreateTeamInput } from './dto/create-team.dto';
import type { GetBandTeamsQuery } from './dto/get-band-teams-query.dto';
import type { GetMyTeamsQuery } from './dto/get-my-teams-query.dto';
import type { GetTeamMembersQuery } from './dto/get-team-members-query.dto';
import type { ReplaceTeamMemberInput } from './dto/replace-team-members.dto';
import type { UpdateTeamInput } from './dto/update-team.dto';
import { TEAMS_REPOSITORY, type TeamsRepository } from './repositories/teams.repository';
import type { AddTeamMemberResult } from './types/add-team-member-result.type';
import type { ChangeTeamLeaderResult } from './types/change-team-leader-result.type';
import type { CreateTeamResult } from './types/create-team-result.type';
import type { DeleteTeamResult } from './types/delete-team-result.type';
import type { GetBandTeamsResult } from './types/get-band-teams-result.type';
import type { GetMyTeamsResult } from './types/get-my-teams-result.type';
import type { GetTeamMembersResult } from './types/get-team-members-result.type';
import type { GetTeamResult } from './types/get-team-result.type';
import type { RemoveTeamMemberResult } from './types/remove-team-member-result.type';
import type { ReplaceTeamMembersResult } from './types/replace-team-members-result.type';
import type { UpdateTeamMemberSessionResult } from './types/update-team-member-session-result.type';
import type { UpdateTeamResult } from './types/update-team-result.type';

@Injectable()
export class TeamsService {
  constructor(
    @Inject(TEAMS_REPOSITORY) private readonly teamsRepository: TeamsRepository,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 밴드 멤버가 팀을 생성한다. 생성자가 자동으로 팀 리더가 된다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} bandId - 팀을 생성할 밴드 ID
   * @param {CreateTeamInput} input - 팀 생성 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<CreateTeamResult>} 생성된 팀 정보
   */
  async createTeam(userId: string, bandId: string, input: CreateTeamInput, tx?: Prisma.TransactionClient): Promise<CreateTeamResult> {
    const run = async (client: Prisma.TransactionClient): Promise<CreateTeamResult> => {
      const band = await this.teamsRepository.findBandById(bandId, client);
      if (!band) {
        throw new NotFoundException('밴드를 찾을 수 없습니다.');
      }

      const bandMember = await this.teamsRepository.findBandMemberByBandIdAndUserId(bandId, userId, client);
      if (!bandMember) {
        throw new ForbiddenException('해당 밴드의 멤버만 팀을 생성할 수 있습니다.');
      }

      return this.teamsRepository.createTeam(
        {
          ...input,
          bandId,
          teamLeaderBandMemberId: bandMember.id,
          teamLeaderUserId: userId,
        },
        client,
      );
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 밴드에 속한 팀 목록을 조회한다.
   *
   * @param {string} bandId - 대상 밴드 ID
   * @param {GetBandTeamsQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetBandTeamsResult>} 밴드 팀 목록
   */
  async getBandTeams(bandId: string, query: GetBandTeamsQuery, tx?: Prisma.TransactionClient): Promise<GetBandTeamsResult> {
    const band = await this.teamsRepository.findBandById(bandId, tx);
    if (!band) {
      throw new NotFoundException('밴드를 찾을 수 없습니다.');
    }
    return this.teamsRepository.findBandTeams(bandId, query, tx);
  }

  /**
   * 팀 상세 정보를 조회한다.
   *
   * @param {string} teamId - 조회할 팀 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetTeamResult>} 팀 상세 정보
   */
  async getTeam(teamId: string, tx?: Prisma.TransactionClient): Promise<GetTeamResult> {
    const team = await this.teamsRepository.findTeamById(teamId, tx);
    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }
    return team;
  }

  /**
   * 팀 리더만 팀 정보를 수정할 수 있다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} teamId - 수정할 팀 ID
   * @param {UpdateTeamInput} input - 수정 입력값
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateTeamResult>} 수정된 팀 정보
   */
  async updateTeam(userId: string, teamId: string, input: UpdateTeamInput, tx?: Prisma.TransactionClient): Promise<UpdateTeamResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdateTeamResult> => {
      const team = await this.teamsRepository.findTeamForUpdate(teamId, client);
      if (!team) {
        throw new NotFoundException('팀을 찾을 수 없습니다.');
      }

      await this.assertTeamLeader(userId, team.bandId, team.teamLeaderBandMemberId, client);

      return this.teamsRepository.updateTeam(teamId, input, client);
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 팀 멤버 목록을 조회한다.
   *
   * @param {string} teamId - 대상 팀 ID
   * @param {GetTeamMembersQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetTeamMembersResult>} 팀 멤버 목록
   */
  async getTeamMembers(teamId: string, query: GetTeamMembersQuery, tx?: Prisma.TransactionClient): Promise<GetTeamMembersResult> {
    const team = await this.teamsRepository.findTeamForUpdate(teamId, tx);
    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }
    return this.teamsRepository.findTeamMembers(teamId, query, tx);
  }

  /**
   * 팀 리더만 팀 리더를 변경할 수 있다. 새 리더는 이미 팀 멤버여야 한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} teamId - 대상 팀 ID
   * @param {ChangeTeamLeaderBodyDto} input - 새 리더 TeamMember ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ChangeTeamLeaderResult>} 변경된 팀 리더 정보
   */
  async changeTeamLeader(
    userId: string,
    teamId: string,
    input: ChangeTeamLeaderBodyDto,
    tx?: Prisma.TransactionClient,
  ): Promise<ChangeTeamLeaderResult> {
    const run = async (client: Prisma.TransactionClient): Promise<ChangeTeamLeaderResult> => {
      const team = await this.teamsRepository.findTeamForUpdate(teamId, client);
      if (!team) {
        throw new NotFoundException('팀을 찾을 수 없습니다.');
      }

      await this.assertTeamLeader(userId, team.bandId, team.teamLeaderBandMemberId, client);

      const newLeaderMember = await this.teamsRepository.findTeamMemberById(input.teamMemberId, client);
      if (!newLeaderMember || newLeaderMember.teamId !== teamId) {
        throw new NotFoundException('해당 팀에서 대상 멤버를 찾을 수 없습니다.');
      }

      if (newLeaderMember.teamRole === 'LEADER') {
        throw new BadRequestException('이미 팀 리더입니다.');
      }

      return this.teamsRepository.changeTeamLeader(teamId, input.teamMemberId, client);
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 팀 리더만 팀 멤버를 제거할 수 있다. 리더 자신은 제거할 수 없다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} teamId - 대상 팀 ID
   * @param {string} teamMemberId - 제거할 TeamMember ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<RemoveTeamMemberResult>} 제거 결과
   */
  async removeTeamMember(userId: string, teamId: string, teamMemberId: string, tx?: Prisma.TransactionClient): Promise<RemoveTeamMemberResult> {
    const run = async (client: Prisma.TransactionClient): Promise<RemoveTeamMemberResult> => {
      const team = await this.teamsRepository.findTeamForUpdate(teamId, client);
      if (!team) {
        throw new NotFoundException('팀을 찾을 수 없습니다.');
      }

      await this.assertTeamLeader(userId, team.bandId, team.teamLeaderBandMemberId, client);

      const targetMember = await this.teamsRepository.findTeamMemberById(teamMemberId, client);
      if (!targetMember || targetMember.teamId !== teamId) {
        throw new NotFoundException('해당 팀에서 대상 멤버를 찾을 수 없습니다.');
      }

      // 리더도 세션 배정이 여러 개일 수 있다. 남은 배정이 있으면 팀에서 빠지는 게
      // 아니라 그 세션만 비우는 것이므로 막지 않는다. 마지막 배정일 때만 막는다.
      if (targetMember.teamRole === 'LEADER') {
        const remaining = await this.teamsRepository.countTeamMemberAssignments(teamId, targetMember.bandMemberId, client);
        if (remaining <= 1) {
          throw new BadRequestException('팀 리더는 자기 자신을 제거할 수 없습니다. 리더 변경 후 제거하세요.');
        }
      }

      return this.teamsRepository.removeTeamMember(teamMemberId, teamId, client);
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 팀 멤버의 세션 배정을 바꾼다.
   *
   * 세션만 바꾸는 건 UPDATE 한 번이면 된다. 제거 후 재추가로 흉내 내면 중간에
   * 실패했을 때 멀쩡히 있던 사람이 팀에서 빠진다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} teamId - 대상 팀 ID
   * @param {string} teamMemberId - 대상 팀 멤버 ID
   * @param {string | null} skillTypeId - 배정할 세션. null이면 미배정으로 되돌린다
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<UpdateTeamMemberSessionResult>} 갱신된 팀 멤버
   */
  async updateTeamMemberSession(
    userId: string,
    teamId: string,
    teamMemberId: string,
    skillTypeId: string | null,
    tx?: Prisma.TransactionClient,
  ): Promise<UpdateTeamMemberSessionResult> {
    const run = async (client: Prisma.TransactionClient): Promise<UpdateTeamMemberSessionResult> => {
      const team = await this.teamsRepository.findTeamForUpdate(teamId, client);
      if (!team) {
        throw new NotFoundException('팀을 찾을 수 없습니다.');
      }

      await this.assertTeamLeader(userId, team.bandId, team.teamLeaderBandMemberId, client);

      const targetMember = await this.teamsRepository.findTeamMemberById(teamMemberId, client);
      if (!targetMember || targetMember.teamId !== teamId) {
        throw new NotFoundException('해당 팀에서 대상 멤버를 찾을 수 없습니다.');
      }

      if (skillTypeId !== null) {
        const existingSkillTypeIds = await this.teamsRepository.findExistingSkillTypeIds([skillTypeId], client);
        if (existingSkillTypeIds.length === 0) {
          throw new BadRequestException('존재하지 않는 세션입니다.');
        }
      }

      // 같은 사람이 같은 세션을 두 번 맡을 수는 없다. 자기 자신은 findTeamMemberByTeamAndBandMember가
      // 함께 잡으므로 id로 걸러낸다.
      const duplicated = await this.teamsRepository.findTeamMemberByTeamAndBandMember(teamId, targetMember.bandMemberId, skillTypeId, client);
      if (duplicated && duplicated.id !== teamMemberId) {
        throw new ConflictException('이미 같은 세션으로 등록된 팀 멤버입니다.');
      }

      // 위 중복 조회와 UPDATE 사이는 잠겨 있지 않다. 같은 세션을 노리는 요청이
      // 동시에 들어오면 둘 다 통과한 뒤 하나가 @@unique에 걸린다.
      // addTeamMember와 같이 P2002를 409로 옮겨 500으로 새지 않게 한다.
      try {
        return await this.teamsRepository.updateTeamMemberSession(teamMemberId, skillTypeId, client);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException('이미 같은 세션으로 등록된 팀 멤버입니다.');
        }
        throw e;
      }
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 팀 명단을 통째로 교체한다. 추가·제거·세션 변경이 한 트랜잭션에서 끝난다.
   *
   * 단건 API를 여러 번 부르면 DELETE는 성공했는데 POST가 실패하는 순간 사람이
   * 사라진 채로 남는다. 화면은 "저장 실패"만 보여주고 사용자는 팀이 이미 바뀐 걸
   * 모른다. 명단 전체를 받아 서버가 한 번에 맞추면 그 중간 상태가 없어진다.
   *
   * 행을 전부 지웠다 다시 만들지 않는 이유: joinedAt(가입일)과 teamRole이
   * 기본값으로 되돌아가 리더가 조용히 MEMBER가 된다. teamMemberId로 같은 행을
   * 이어받아 세션만 바뀐 경우는 UPDATE로 처리한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} teamId - 대상 팀 ID
   * @param {ReplaceTeamMemberInput[]} members - 교체 후 명단 전체
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<ReplaceTeamMembersResult>} 교체 후 팀 명단
   */
  async replaceTeamMembers(
    userId: string,
    teamId: string,
    members: ReplaceTeamMemberInput[],
    tx?: Prisma.TransactionClient,
  ): Promise<ReplaceTeamMembersResult> {
    const run = async (client: Prisma.TransactionClient): Promise<ReplaceTeamMembersResult> => {
      const team = await this.teamsRepository.findTeamForUpdate(teamId, client);
      if (!team) {
        throw new NotFoundException('팀을 찾을 수 없습니다.');
      }

      await this.assertTeamLeader(userId, team.bandId, team.teamLeaderBandMemberId, client);

      const normalized = members.map(member => ({
        teamMemberId: member.teamMemberId,
        bandMemberId: member.bandMemberId,
        skillTypeId: member.skillTypeId ?? null,
      }));

      // 세션 하나에 한 명. 프론트에서도 막지만 화면을 거치지 않는 요청이 있으므로
      // 서버가 계약의 주인이다. 미배정(null)은 여럿이어도 된다.
      const assignedSessions = normalized.map(member => member.skillTypeId).filter((id): id is string => id !== null);
      if (new Set(assignedSessions).size !== assignedSessions.length) {
        throw new BadRequestException('한 세션에는 한 명만 배정할 수 있습니다.');
      }

      // 같은 사람을 같은 세션에 두 번 넣으면 @@unique에 걸려 P2002가 난다. 먼저 막는다.
      const pairs = normalized.map(member => `${member.bandMemberId}:${member.skillTypeId ?? ''}`);
      if (new Set(pairs).size !== pairs.length) {
        throw new BadRequestException('같은 멤버를 같은 세션에 두 번 배정할 수 없습니다.');
      }

      const uniqueBandMemberIds = [...new Set(normalized.map(member => member.bandMemberId))];
      const validBandMemberIds = await this.teamsRepository.findBandMemberIdsInBand(team.bandId, uniqueBandMemberIds, client);
      if (validBandMemberIds.length !== uniqueBandMemberIds.length) {
        throw new BadRequestException('같은 밴드의 멤버만 팀에 추가할 수 있습니다.');
      }

      const uniqueSkillTypeIds = [...new Set(assignedSessions)];
      if (uniqueSkillTypeIds.length > 0) {
        const existingSkillTypeIds = await this.teamsRepository.findExistingSkillTypeIds(uniqueSkillTypeIds, client);
        if (existingSkillTypeIds.length !== uniqueSkillTypeIds.length) {
          throw new BadRequestException('존재하지 않는 세션입니다.');
        }
      }

      // 리더는 명단에서 빠질 수 없다. removeTeamMember와 같은 규칙 — 리더를 빼려면
      // 리더를 먼저 바꿔야 한다. 세션만 바뀌거나 배정이 줄어드는 건 허용한다.
      if (team.teamLeaderBandMemberId && !normalized.some(member => member.bandMemberId === team.teamLeaderBandMemberId)) {
        throw new BadRequestException('팀 리더는 명단에서 제외할 수 없습니다. 리더 변경 후 제외하세요.');
      }

      const currentRows = await this.teamsRepository.findTeamMemberRows(teamId, client);
      const currentById = new Map(currentRows.map(row => [row.id, row]));

      // 손대지 않는 행 / 세션이 바뀌어 다시 만들 행 / 새로 만들 행으로 가른다.
      const untouchedRowIds = new Set<string>();
      const rowsToCreate: { bandMemberId: string; skillTypeId: string | null; joinedAt?: Date; teamRole?: string }[] = [];

      for (const member of normalized) {
        const origin = member.teamMemberId ? currentById.get(member.teamMemberId) : undefined;
        if (member.teamMemberId && !origin) {
          throw new BadRequestException('해당 팀에 없는 팀 멤버입니다.');
        }

        // 사람도 세션도 그대로면 건드릴 이유가 없다.
        if (origin && origin.bandMemberId === member.bandMemberId && origin.skillTypeId === member.skillTypeId) {
          untouchedRowIds.add(origin.id);
          continue;
        }

        // 같은 사람의 세션만 바뀐 경우. 행을 다시 만들되 가입일과 역할을 그대로 옮겨
        // 담는다 — 지웠다 만드는 건 행의 정체성이 아니라 쓰기 순서 문제를 피하려는 것이다.
        if (origin && origin.bandMemberId === member.bandMemberId) {
          rowsToCreate.push({
            bandMemberId: member.bandMemberId,
            skillTypeId: member.skillTypeId,
            joinedAt: origin.joinedAt,
            teamRole: origin.teamRole,
          });
          continue;
        }

        // 사람이 바뀌었거나 새 행이다. 다른 사람이 들어오는 것이므로 가입일은 새로 찍힌다.
        rowsToCreate.push({ bandMemberId: member.bandMemberId, skillTypeId: member.skillTypeId });
      }

      // 삭제를 먼저 끝내야 생성이 unique와 부딪히지 않는다.
      //
      // UPDATE로 세션을 옮기지 않는 이유: 중간 상태가 인덱스에 걸린다. 미배정으로
      // 잠깐 내렸다 올리는 우회도 안 된다 — 이 PR의 베이스(#200)가 넣은
      // team_members_team_member_no_skill_key가 (team_id, band_member_id)의 NULL 행을
      // 하나로 제한해서, 같은 사람의 행이 동시에 NULL이 되는 순간 위반이다.
      // 한 트랜잭션 안이라 지웠다 만드는 데 따르는 위험은 없고, 잃을 뻔한
      // joinedAt·teamRole은 위에서 그대로 옮긴다.
      const toDeleteIds = currentRows.filter(row => !untouchedRowIds.has(row.id)).map(row => row.id);
      await this.teamsRepository.deleteTeamMemberRows(teamId, toDeleteIds, client);
      await this.teamsRepository.createTeamMemberRows(teamId, rowsToCreate, client);

      return { teamId, members: await this.teamsRepository.findAllTeamMembers(teamId, client) };
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 인증된 사용자가 속한 팀 목록을 조회한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {GetMyTeamsQuery} query - 커서 기반 목록 조회 조건
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<GetMyTeamsResult>} 내 팀 목록
   */
  async getMyTeams(userId: string, query: GetMyTeamsQuery, tx?: Prisma.TransactionClient): Promise<GetMyTeamsResult> {
    return this.teamsRepository.findMyTeams(userId, query, tx);
  }

  /**
   * 팀 리더만 밴드 멤버를 팀에 추가할 수 있다.
   * 추가 대상은 같은 밴드의 멤버여야 하며 이미 팀에 없어야 한다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} teamId - 대상 팀 ID
   * @param {string} bandMemberId - 추가할 밴드 멤버 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<AddTeamMemberResult>} 추가된 팀 멤버 정보
   */
  async addTeamMember(
    userId: string,
    teamId: string,
    bandMemberId: string,
    skillTypeId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<AddTeamMemberResult> {
    const run = async (client: Prisma.TransactionClient): Promise<AddTeamMemberResult> => {
      const team = await this.teamsRepository.findTeamForUpdate(teamId, client);
      if (!team) {
        throw new NotFoundException('팀을 찾을 수 없습니다.');
      }

      await this.assertTeamLeader(userId, team.bandId, team.teamLeaderBandMemberId, client);

      const targetBandMember = await this.teamsRepository.findBandMemberById(bandMemberId, client);
      if (!targetBandMember) {
        throw new NotFoundException('해당 밴드 멤버를 찾을 수 없습니다.');
      }

      if (targetBandMember.bandId !== team.bandId) {
        throw new BadRequestException('같은 밴드의 멤버만 팀에 추가할 수 있습니다.');
      }

      // @IsOptional()이 null도 통과시킨다. null을 그대로 넘기면 `in: [null]`로 500이 된다.
      if (skillTypeId != null) {
        const existingSkillTypeIds = await this.teamsRepository.findExistingSkillTypeIds([skillTypeId], client);
        if (existingSkillTypeIds.length === 0) {
          throw new BadRequestException('존재하지 않는 세션입니다.');
        }
      }

      // 한 사람이 팀 안에서 보컬·기타를 겸할 수 있으므로 세션까지 같아야 중복이다.
      const existing = await this.teamsRepository.findTeamMemberByTeamAndBandMember(teamId, bandMemberId, skillTypeId ?? null, client);
      if (existing) {
        throw new ConflictException('이미 같은 세션으로 등록된 팀 멤버입니다.');
      }

      try {
        return await this.teamsRepository.addTeamMember(teamId, bandMemberId, skillTypeId ?? null, client);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException('이미 같은 세션으로 등록된 팀 멤버입니다.');
        }
        throw e;
      }
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 팀 리더만 팀을 삭제할 수 있다. 팀 멤버는 cascade로 함께 삭제된다.
   *
   * @param {string} userId - 인증된 사용자 ID
   * @param {string} teamId - 삭제할 팀 ID
   * @param {Prisma.TransactionClient | undefined} tx - 상위 트랜잭션 client
   * @returns {Promise<DeleteTeamResult>} 삭제 결과
   */
  async deleteTeam(userId: string, teamId: string, tx?: Prisma.TransactionClient): Promise<DeleteTeamResult> {
    const run = async (client: Prisma.TransactionClient): Promise<DeleteTeamResult> => {
      const team = await this.teamsRepository.findTeamForUpdate(teamId, client);
      if (!team) {
        throw new NotFoundException('팀을 찾을 수 없습니다.');
      }

      await this.assertTeamLeader(userId, team.bandId, team.teamLeaderBandMemberId, client);

      return this.teamsRepository.deleteTeam(teamId, client);
    };

    return tx ? run(tx) : this.prisma.$transaction(run);
  }

  /**
   * 사용자가 해당 팀의 리더인지 검증한다.
   * teamLeaderBandMemberId가 없거나 사용자의 BandMember.id와 일치하지 않으면 403을 던진다.
   */
  private async assertTeamLeader(
    userId: string,
    bandId: string,
    teamLeaderBandMemberId: string | null,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (!teamLeaderBandMemberId) {
      throw new ForbiddenException('팀 리더 권한이 필요합니다.');
    }

    const myBandMember = await this.teamsRepository.findBandMemberByBandIdAndUserId(bandId, userId, tx);
    if (!myBandMember || myBandMember.id !== teamLeaderBandMemberId) {
      throw new ForbiddenException('팀 리더 권한이 필요합니다.');
    }
  }
}

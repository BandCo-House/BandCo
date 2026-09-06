import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import { Prisma } from '../../generated/prisma';

import type { ChangeTeamLeaderBodyDto } from './dto/change-team-leader.dto';
import type { CreateTeamInput } from './dto/create-team.dto';
import type { GetBandTeamsQuery } from './dto/get-band-teams-query.dto';
import type { GetMyTeamsQuery } from './dto/get-my-teams-query.dto';
import type { GetTeamMembersQuery } from './dto/get-team-members-query.dto';
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

      if (targetMember.teamRole === 'LEADER') {
        throw new BadRequestException('팀 리더는 자기 자신을 제거할 수 없습니다. 리더 변경 후 제거하세요.');
      }

      return this.teamsRepository.removeTeamMember(teamMemberId, teamId, client);
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

      if (skillTypeId !== undefined) {
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

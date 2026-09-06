import type { Prisma } from '../../../generated/prisma';
import type { CreateTeamInput } from '../dto/create-team.dto';
import type { GetBandTeamsQuery } from '../dto/get-band-teams-query.dto';
import type { GetMyTeamsQuery } from '../dto/get-my-teams-query.dto';
import type { GetTeamMembersQuery } from '../dto/get-team-members-query.dto';
import type { UpdateTeamInput } from '../dto/update-team.dto';
import type { AddTeamMemberResult } from '../types/add-team-member-result.type';
import type { ChangeTeamLeaderResult } from '../types/change-team-leader-result.type';
import type { CreateTeamResult } from '../types/create-team-result.type';
import type { DeleteTeamResult } from '../types/delete-team-result.type';
import type { GetBandTeamsResult } from '../types/get-band-teams-result.type';
import type { GetMyTeamsResult } from '../types/get-my-teams-result.type';
import type { GetTeamMembersResult } from '../types/get-team-members-result.type';
import type { GetTeamResult } from '../types/get-team-result.type';
import type { RemoveTeamMemberResult } from '../types/remove-team-member-result.type';
import type { UpdateTeamResult } from '../types/update-team-result.type';

export const TEAMS_REPOSITORY = Symbol('TEAMS_REPOSITORY');

export interface CreateTeamRepositoryInput extends CreateTeamInput {
  bandId: string;
  teamLeaderBandMemberId: string;
  teamLeaderUserId: string;
}

export interface TeamsRepository {
  /** 삭제되지 않은 밴드 존재 여부 확인 */
  findBandById(bandId: string, tx?: Prisma.TransactionClient): Promise<{ id: string } | null>;

  /** 밴드 멤버 존재 여부 확인 */
  findBandMemberByBandIdAndUserId(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
  } | null>;

  /** 밴드 멤버 단건 조회 (팀 멤버 추가 시 밴드 멤버 검증) */
  findBandMemberById(
    bandMemberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandId: string;
  } | null>;

  /** 팀 생성 (팀 리더 TeamMember 동시 생성) */
  createTeam(input: CreateTeamRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateTeamResult>;

  /** 밴드 팀 목록 조회 (커서 페이지네이션) */
  findBandTeams(bandId: string, query: GetBandTeamsQuery, tx?: Prisma.TransactionClient): Promise<GetBandTeamsResult>;

  /** 팀 상세 조회 */
  findTeamById(teamId: string, tx?: Prisma.TransactionClient): Promise<GetTeamResult | null>;

  /** 팀 존재 여부 및 권한 체크용 조회 */
  findTeamForUpdate(
    teamId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    bandId: string;
    teamLeaderBandMemberId: string | null;
  } | null>;

  /**
   * 팀 멤버십 확인 (팀 내 특정 밴드 멤버 + 세션 조회).
   * 한 사람이 팀 안에서 여러 세션을 맡을 수 있어 세션까지 같아야 같은 배정이다.
   */
  findTeamMemberByTeamAndBandMember(
    teamId: string,
    bandMemberId: string,
    skillTypeId?: string | null,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    teamRole: string;
  } | null>;

  /** 팀 멤버 단건 조회 */
  findTeamMemberById(
    teamMemberId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    teamId: string;
    bandMemberId: string;
    teamRole: string;
  } | null>;

  /** 팀 정보 수정 */
  updateTeam(teamId: string, input: UpdateTeamInput, tx?: Prisma.TransactionClient): Promise<UpdateTeamResult>;

  /** 팀 멤버 목록 조회 (커서 페이지네이션) */
  findTeamMembers(teamId: string, query: GetTeamMembersQuery, tx?: Prisma.TransactionClient): Promise<GetTeamMembersResult>;

  /** 팀 리더 변경 */
  changeTeamLeader(teamId: string, newLeaderTeamMemberId: string, tx?: Prisma.TransactionClient): Promise<ChangeTeamLeaderResult>;

  /** 팀 멤버 제거 */
  removeTeamMember(teamMemberId: string, teamId: string, tx?: Prisma.TransactionClient): Promise<RemoveTeamMemberResult>;

  /** 내 팀 목록 조회 (커서 페이지네이션) */
  findMyTeams(userId: string, query: GetMyTeamsQuery, tx?: Prisma.TransactionClient): Promise<GetMyTeamsResult>;

  /** 팀 멤버 추가 */
  addTeamMember(teamId: string, bandMemberId: string, skillTypeId?: string | null, tx?: Prisma.TransactionClient): Promise<AddTeamMemberResult>;

  /**
   * 팀 안에서 그 사람이 가진 세션 배정 행 수를 센다.
   * 리더의 마지막 배정인지(=팀에서 빠지는지) 판단할 때 쓴다.
   */
  countTeamMemberAssignments(teamId: string, bandMemberId: string, tx?: Prisma.TransactionClient): Promise<number>;

  /** 존재하는 skillType ID만 추려 돌려준다. 세션 배정 검증용. */
  findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;

  /** 팀 삭제 (hard delete, TeamMember cascade) */
  deleteTeam(teamId: string, tx?: Prisma.TransactionClient): Promise<DeleteTeamResult>;
}

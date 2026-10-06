import type { TeamMemberListItem } from './get-team-members-result.type';

export interface ReplaceTeamMembersResult {
  teamId: string;
  /** 교체 후 팀 명단 전체. 프론트가 다시 조회하지 않아도 되도록 결과를 함께 돌려준다. */
  members: TeamMemberListItem[];
}

import type { TeamMemberSkillType, TeamMemberUserInfo } from './get-team-members-result.type';

export interface UpdateTeamMemberSessionResult {
  teamMemberId: string;
  teamId: string;
  bandMemberId: string;
  user: TeamMemberUserInfo;
  teamRole: string;
  joinedAt: string;
  skillType: TeamMemberSkillType | null;
}

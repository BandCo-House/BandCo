export interface TeamMemberUserInfo {
  userId: string;
  nickname: string;
  profileImageUrl: string | null;
}

export interface TeamMemberSkillInfo {
  skillTypeId: string;
  skillName: string;
  skillLevel: string;
  isPrimary: boolean;
}

export interface TeamMemberListItem {
  teamMemberId: string;
  bandMemberId: string;
  user: TeamMemberUserInfo;
  teamRole: string;
  joinedAt: string;
  skills: TeamMemberSkillInfo[];
}

export interface TeamMemberListCursor {
  joinedAt: string;
  id: string;
}

export interface GetTeamMembersResult {
  teamId: string;
  items: TeamMemberListItem[];
  meta: {
    count: number;
    take: number;
    cursor: TeamMemberListCursor | null;
    next: string | null;
  };
}

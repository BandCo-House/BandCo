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

/** 이 팀에서 맡은 세션. 개인이 보유한 스킬(skills)과 다른 값이다. */
export interface TeamMemberSkillType {
  skillTypeId: string;
  name: string;
}

export interface TeamMemberListItem {
  teamMemberId: string;
  bandMemberId: string;
  user: TeamMemberUserInfo;
  teamRole: string;
  joinedAt: string;
  /** 팀 편성상 맡은 세션. 미배정이면 null. */
  skillType: TeamMemberSkillType | null;
  /** 그 사람이 보유한 스킬 전체. 팀 배정과 무관하다. */
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

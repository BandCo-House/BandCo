export interface TeamMemberUserInfo {
  userId: string;
  nickname: string;
  profileImageUrl: string | null;
}

export interface TeamMemberListItem {
  teamMemberId: string;
  bandMemberId: string;
  user: TeamMemberUserInfo;
  teamRole: string;
  joinedAt: string;
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

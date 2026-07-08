import type { TeamLeaderInfo } from './get-band-teams-result.type';

export interface MyTeamListItem {
  teamId: string;
  bandId: string;
  bandName: string;
  name: string;
  description: string | null;
  status: string;
  teamCoverUrl: string | null;
  myTeamRole: string;
  memberCount: number;
  teamLeader: TeamLeaderInfo | null;
  joinedAt: string;
  createdAt: string;
}

export interface MyTeamListCursor {
  joinedAt: string;
  id: string;
}

export interface GetMyTeamsResult {
  items: MyTeamListItem[];
  meta: {
    count: number;
    take: number;
    cursor: MyTeamListCursor | null;
    next: string | null;
  };
}

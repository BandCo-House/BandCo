export interface TeamLeaderInfo {
  userId: string;
  nickname: string;
}

export interface BandTeamListItem {
  teamId: string;
  name: string;
  description: string | null;
  status: string;
  teamCoverUrl: string | null;
  memberCount: number;
  teamLeader: TeamLeaderInfo | null;
  createdAt: string;
}

export interface BandTeamListCursor {
  createdAt: string;
  id: string;
}

export interface GetBandTeamsResult {
  bandId: string;
  items: BandTeamListItem[];
  meta: {
    count: number;
    take: number;
    cursor: BandTeamListCursor | null;
    next: string | null;
  };
}

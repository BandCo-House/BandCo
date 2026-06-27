import type { TeamLeaderInfo } from './get-band-teams-result.type';

export interface GetTeamResult {
  teamId: string;
  bandId: string;
  name: string;
  description: string | null;
  status: string;
  teamCoverUrl: string | null;
  teamLeader: TeamLeaderInfo | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamResult {
  teamId: string;
  bandId: string;
  name: string;
  description: string | null;
  status: string;
  teamLeaderUserId: string;
  teamCoverUrl: string | null;
  createdAt: string;
}

import type { TeamLeaderInfo } from './get-band-teams-result.type';

export interface ChangeTeamLeaderResult {
  teamId: string;
  teamLeader: TeamLeaderInfo;
}

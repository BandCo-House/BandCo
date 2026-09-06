import { useQuery } from '@tanstack/react-query';
import { getMyBands } from '@/entities/band/api/band-api';
import { useBandTeams } from '@/entities/team/api/queries';
import type { BandSettingsTab } from './tabs';

export interface BandSettingsAccess {
  isBandLeader: boolean;
  isBandSubLeader: boolean;
  isTeamLeader: boolean;
  canAccessSettings: boolean;
  allowedTabs: BandSettingsTab[];
  isLoading: boolean;
}

/**
 * 밴드 설정 화면의 접근 권한을 계산하는 훅.
 * - Vite 개발 환경(`import.meta.env.DEV`)에서는 모든 탭에 자유롭게 접근할 수 있도록 가드를 자동 바이패스합니다.
 * - 프로덕션 환경에서는:
 *   - 리더(BM) / 부리더(ADMIN): 기본 설정('basic'), 멤버 권한 관리('members'), 팀 관리('teams') 모두 접근 가능
 *   - 팀 리더: 팀 관리('teams')만 접근 가능
 *   - 일반 멤버: 설정 페이지 자체 접근 불가
 */
export const useBandSettingsAccess = (bandId: string): BandSettingsAccess => {
  const isDev = import.meta.env.DEV;

  const { data: myBands = [], isLoading: isBandsLoading } = useQuery({
    queryKey: ['bands', 'me'],
    queryFn: getMyBands,
  });

  const { data: teams = [], isLoading: isTeamsLoading } = useBandTeams(bandId);

  // Vite 개발 환경에서는 가드를 무시하고 모든 탭 허용
  if (isDev) {
    return {
      isBandLeader: true,
      isBandSubLeader: true,
      isTeamLeader: true,
      canAccessSettings: true,
      allowedTabs: ['basic', 'members', 'teams'],
      isLoading: false,
    };
  }

  const currentBand = myBands.find((b) => b.id === bandId);
  const myRole = currentBand?.myRole ?? 'MEMBER';

  const isBandLeader = myRole === 'BM';
  const isBandSubLeader = myRole === 'ADMIN';
  const isTeamLeader = teams.length > 0 && !isBandLeader && !isBandSubLeader;

  const allowedTabs: BandSettingsTab[] = [];
  if (isBandLeader || isBandSubLeader) {
    allowedTabs.push('basic', 'members', 'teams');
  } else if (isTeamLeader) {
    allowedTabs.push('teams');
  }

  const canAccessSettings = allowedTabs.length > 0;

  return {
    isBandLeader,
    isBandSubLeader,
    isTeamLeader,
    canAccessSettings,
    allowedTabs,
    isLoading: isBandsLoading || isTeamsLoading,
  };
};

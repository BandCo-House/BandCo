import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as bandApi from '@/entities/band/api/band-api';
import type { Band } from '@/entities/band/model/types';
import * as teamApi from '@/entities/team/api/team-api';
import type { BandTeamListItem } from '@/entities/team/model/types';
import { useBandSettingsAccess } from './useBandSettingsAccess';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const MOCK_TEAMS: BandTeamListItem[] = [
  {
    teamId: 'team-1',
    name: '듀얼 기타',
    description: null,
    status: 'ACTIVE',
    teamCoverUrl: null,
    memberCount: 2,
    teamLeader: { userId: 'u-1', nickname: '김민준' },
    createdAt: '2026-05-01T00:00:00Z',
  },
];

describe('useBandSettingsAccess', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('개발 환경(import.meta.env.DEV)에서는 모든 권한이 허용되고 전체 탭에 접근할 수 있다', async () => {
    // DEV 모드 활성화
    vi.stubEnv('DEV', true);

    const { result } = renderHook(() => useBandSettingsAccess('band-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.canAccessSettings).toBe(true);
    expect(result.current.allowedTabs).toEqual(['basic', 'members', 'teams']);
    expect(result.current.isBandLeader).toBe(true);
    expect(result.current.isBandSubLeader).toBe(true);
    expect(result.current.isTeamLeader).toBe(true);
  });

  describe('프로덕션 환경 (import.meta.env.DEV = false)', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false);
    });

    it('밴드 리더(BM)는 모든 설정 탭(basic, members, teams)에 접근할 수 있다', async () => {
      const mockBands: Partial<Band>[] = [
        {
          id: 'band-1',
          name: '신촌 락밴드',
          myRole: 'BM',
          visibility: true,
          createdAt: '2026-01-01T00:00:00Z',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(bandApi, 'getMyBands').mockResolvedValue(mockBands as Band[]);
      vi.spyOn(teamApi, 'getBandTeams').mockResolvedValue(MOCK_TEAMS);

      const { result } = renderHook(() => useBandSettingsAccess('band-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isBandLeader).toBe(true);
      expect(result.current.isBandSubLeader).toBe(false);
      expect(result.current.canAccessSettings).toBe(true);
      expect(result.current.allowedTabs).toEqual(['basic', 'members', 'teams']);
    });

    it('밴드 부리더(ADMIN)는 모든 설정 탭(basic, members, teams)에 접근할 수 있다', async () => {
      const mockBands: Partial<Band>[] = [
        {
          id: 'band-1',
          name: '신촌 락밴드',
          myRole: 'ADMIN',
          visibility: true,
          createdAt: '2026-01-01T00:00:00Z',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(bandApi, 'getMyBands').mockResolvedValue(mockBands as Band[]);
      vi.spyOn(teamApi, 'getBandTeams').mockResolvedValue(MOCK_TEAMS);

      const { result } = renderHook(() => useBandSettingsAccess('band-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isBandLeader).toBe(false);
      expect(result.current.isBandSubLeader).toBe(true);
      expect(result.current.canAccessSettings).toBe(true);
      expect(result.current.allowedTabs).toEqual(['basic', 'members', 'teams']);
    });

    it('팀 리더는 팀 관리(teams) 탭에만 접근할 수 있다', async () => {
      const mockBands: Partial<Band>[] = [
        {
          id: 'band-1',
          name: '신촌 락밴드',
          myRole: 'MEMBER',
          visibility: true,
          createdAt: '2026-01-01T00:00:00Z',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(bandApi, 'getMyBands').mockResolvedValue(mockBands as Band[]);
      vi.spyOn(teamApi, 'getBandTeams').mockResolvedValue(MOCK_TEAMS);

      const { result } = renderHook(() => useBandSettingsAccess('band-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isBandLeader).toBe(false);
      expect(result.current.isBandSubLeader).toBe(false);
      expect(result.current.isTeamLeader).toBe(true);
      expect(result.current.canAccessSettings).toBe(true);
      expect(result.current.allowedTabs).toEqual(['teams']);
    });

    it('일반 멤버(MEMBER, 팀 리더 아님)는 설정에 접근할 수 없다 (allowedTabs 비어있음)', async () => {
      const mockBands: Partial<Band>[] = [
        {
          id: 'band-1',
          name: '신촌 락밴드',
          myRole: 'MEMBER',
          visibility: true,
          createdAt: '2026-01-01T00:00:00Z',
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ];

      vi.spyOn(bandApi, 'getMyBands').mockResolvedValue(mockBands as Band[]);
      vi.spyOn(teamApi, 'getBandTeams').mockResolvedValue([]); // 소속 팀 리더 없음

      const { result } = renderHook(() => useBandSettingsAccess('band-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isBandLeader).toBe(false);
      expect(result.current.isBandSubLeader).toBe(false);
      expect(result.current.isTeamLeader).toBe(false);
      expect(result.current.canAccessSettings).toBe(false);
      expect(result.current.allowedTabs).toEqual([]);
    });
  });
});

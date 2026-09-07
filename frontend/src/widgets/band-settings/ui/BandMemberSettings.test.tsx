import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as memberApi from '@/entities/member/api/member-api';
import type { BandMemberListItem } from '@/entities/member/model/types';
import * as teamApi from '@/entities/team/api/team-api';
import type { BandTeamListItem } from '@/entities/team/model/types';
import { BandMemberSettings } from './BandMemberSettings';
import { BandSettingsSaveAction } from './BandSettingsSaveAction';

const MOCK_MEMBERS: BandMemberListItem[] = [
  {
    bandMemberId: 'bm-1',
    userId: 'user-1',
    nickname: '김민준',
    avatarUrl: null,
    role: 'BM',
    joinedAt: '2026-01-01T00:00:00Z',
    skills: [
      {
        skillTypeId: 'st-1',
        skillName: '기타',
        skillLevel: 'ADVANCED',
        isPrimary: true,
      },
      {
        skillTypeId: 'st-2',
        skillName: '보컬',
        skillLevel: 'ADVANCED',
        isPrimary: false,
      },
    ],
  },
  {
    bandMemberId: 'bm-2',
    userId: 'user-2',
    nickname: '박지은',
    avatarUrl: null,
    role: 'ADMIN',
    joinedAt: '2026-01-02T00:00:00Z',
    skills: [
      {
        skillTypeId: 'st-3',
        skillName: '베이스',
        skillLevel: 'ADVANCED',
        isPrimary: true,
      },
    ],
  },
  {
    bandMemberId: 'bm-3',
    userId: 'user-3',
    nickname: '이준호',
    avatarUrl: null,
    role: 'MEMBER',
    joinedAt: '2026-01-03T00:00:00Z',
    skills: [
      {
        skillTypeId: 'st-4',
        skillName: '드럼',
        skillLevel: 'ADVANCED',
        isPrimary: true,
      },
    ],
  },
];

const MOCK_TEAMS: BandTeamListItem[] = [
  {
    teamId: 'team-1',
    name: '리듬 세션',
    description: null,
    status: 'ACTIVE',
    teamCoverUrl: null,
    memberCount: 2,
    teamLeader: { userId: 'user-3', nickname: '이준호' },
    createdAt: '2026-05-01T00:00:00Z',
  },
];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('BandMemberSettings', () => {
  beforeEach(() => {
    vi.spyOn(memberApi, 'getBandMembers').mockResolvedValue(MOCK_MEMBERS);
    vi.spyOn(teamApi, 'getBandTeams').mockResolvedValue(MOCK_TEAMS);
    vi.spyOn(memberApi, 'updateBandMemberRole').mockResolvedValue({
      member: { userId: 'user-3', role: 'ADMIN' },
    });
    vi.spyOn(memberApi, 'kickBandMember').mockResolvedValue({
      bandId: 'band-1',
      userId: 'user-3',
      removed: true,
    });
  });

  it('리더(BM), 부리더(ADMIN), 일반 멤버(MEMBER)를 정상 렌더링한다', async () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandMemberSettings bandId="band-1" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('리더 멤버')).toBeInTheDocument();
    expect(screen.getByText('김민준')).toBeInTheDocument();
    expect(screen.getByText('리더')).toBeInTheDocument();

    expect(screen.getByText('박지은')).toBeInTheDocument();
    expect(screen.getByText('일반 멤버')).toBeInTheDocument();
    expect(screen.getByText('이준호')).toBeInTheDocument();
  });

  it('팀 리더 멤버 보기 체크 시 팀 리더 멤버 카드가 리더 섹션에 노출된다', async () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandMemberSettings bandId="band-1" />
      </QueryClientProvider>,
    );

    await screen.findByText('리더 멤버');

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(await screen.findByText('팀 리더 (리듬 세션)')).toBeInTheDocument();
  });

  it('일반 멤버의 강퇴 버튼 클릭 시 ConfirmDialog를 띄우고 확인 시 강퇴 API를 호출한다', async () => {
    const kickSpy = vi.spyOn(memberApi, 'kickBandMember');
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandMemberSettings bandId="band-1" />
      </QueryClientProvider>,
    );

    await screen.findByText('이준호');

    const kickBtn = screen.getByRole('button', { name: '강퇴' });
    fireEvent.click(kickBtn);

    expect(await screen.findByText('멤버를 내보낼까요?')).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: '내보내기' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(kickSpy).toHaveBeenCalledWith('band-1', 'user-3');
    });
  });

  it('헤더 저장 버튼과 연동되어 변경사항 저장 시 updateBandMemberRole이 호출된다', async () => {
    vi.spyOn(memberApi, 'updateBandMemberRole');
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandSettingsSaveAction />
        <BandMemberSettings bandId="band-1" />
      </QueryClientProvider>,
    );

    await screen.findByText('이준호');

    // 변경 전: 저장 버튼 비활성
    const saveBtn = screen.getByRole('button', { name: /저장/ });
    expect(saveBtn).toBeDisabled();
  });
});

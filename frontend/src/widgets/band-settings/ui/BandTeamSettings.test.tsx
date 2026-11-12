import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ComponentPropsWithoutRef } from 'react';
import * as teamApi from '@/entities/team/api/team-api';
import type { BandTeamListItem, TeamMember } from '@/entities/team/model/types';
import { BandTeamCard } from './BandTeamCard';
import { BandTeamSettings } from './BandTeamSettings';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({
      children,
      to,
      ...props
    }: ComponentPropsWithoutRef<'a'> & { to?: unknown }) => (
      <a href={typeof to === 'string' ? to : '#'} {...props}>
        {children}
      </a>
    ),
  };
});

const MOCK_TEAMS: BandTeamListItem[] = [
  {
    teamId: 'team-1',
    name: '듀얼 기타 편성',
    description: null,
    status: 'ACTIVE',
    teamCoverUrl: null,
    memberCount: 2,
    teamLeader: { userId: 'u-1', nickname: '김민준' },
    createdAt: '2026-05-01T00:00:00Z',
  },
  {
    teamId: 'team-2',
    name: '듀얼 보컬 편성',
    description: null,
    status: 'ACTIVE',
    teamCoverUrl: null,
    memberCount: 2,
    teamLeader: { userId: 'u-3', nickname: '김루나' },
    createdAt: '2026-05-02T00:00:00Z',
  },
];

const MOCK_MEMBERS: TeamMember[] = [
  {
    teamMemberId: 'tm-1',
    bandMemberId: 'bm-1',
    user: { userId: 'u-1', nickname: '김민준', profileImageUrl: null },
    teamRole: 'LEADER',
    skillType: { skillTypeId: 'st-1', name: '기타' },
    skills: [
      {
        skillTypeId: 'st-1',
        skillName: '기타',
        skillLevel: 'ADVANCED',
        isPrimary: true,
      },
    ],
  },
  {
    teamMemberId: 'tm-2',
    bandMemberId: 'bm-2',
    user: { userId: 'u-2', nickname: '박민준', profileImageUrl: null },
    teamRole: 'MEMBER',
    // 세션 미배정. 보유 스킬이 있어도 팀 세션으로 보이면 안 된다.
    skillType: null,
    skills: [
      {
        skillTypeId: 'st-3',
        skillName: '키보드',
        skillLevel: 'INTERMEDIATE',
        isPrimary: true,
      },
      {
        skillTypeId: 'st-4',
        skillName: '보컬',
        skillLevel: 'BEGINNER',
        isPrimary: false,
      },
    ],
  },
];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

describe('BandTeamCard', () => {
  beforeEach(() => {
    vi.spyOn(teamApi, 'getTeamMembers').mockResolvedValue(MOCK_MEMBERS);
  });

  it('팀 세션(skillType)으로 요약하고, 미배정 팀원은 보유 스킬 대신 이름만 보여준다', async () => {
    const onToggleSelect = vi.fn();
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCard
          bandId="band-1"
          team={MOCK_TEAMS[0]}
          isSelected={false}
          onToggleSelect={onToggleSelect}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('듀얼 기타 편성')).toBeInTheDocument();
    const summary = (await screen.findByText('기타: 김민준')).parentElement;
    expect(summary).toHaveTextContent('박민준');
    expect(summary).not.toHaveTextContent('키보드');
  });

  it('체크박스 클릭 시 onToggleSelect 콜백이 호출된다', async () => {
    const onToggleSelect = vi.fn();
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCard
          bandId="band-1"
          team={MOCK_TEAMS[0]}
          isSelected={false}
          onToggleSelect={onToggleSelect}
        />
      </QueryClientProvider>,
    );

    const checkbox = screen.getByRole('checkbox', {
      name: '듀얼 기타 편성 선택',
    });
    fireEvent.click(checkbox);
    expect(onToggleSelect).toHaveBeenCalledWith('team-1');
  });

  it('아코디언 토글 버튼을 클릭하면 멤버 상세 칩을 접거나 펼친다', async () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCard
          bandId="band-1"
          team={MOCK_TEAMS[0]}
          isSelected={false}
          onToggleSelect={vi.fn()}
        />
      </QueryClientProvider>,
    );

    // 기본 펼침 상태 -> 접기 버튼 클릭
    const collapseBtn = await screen.findByRole('button', {
      name: '듀얼 기타 편성 팀원 접기',
    });
    fireEvent.click(collapseBtn);

    // 접힌 후 -> 펼치기 버튼으로 변경
    expect(
      screen.getByRole('button', { name: '듀얼 기타 편성 팀원 펼치기' }),
    ).toBeInTheDocument();
  });
});

describe('BandTeamSettings', () => {
  beforeEach(() => {
    vi.spyOn(teamApi, 'getBandTeams').mockResolvedValue(MOCK_TEAMS);
    vi.spyOn(teamApi, 'getTeamMembers').mockResolvedValue(MOCK_MEMBERS);
    vi.spyOn(teamApi, 'deleteTeam').mockResolvedValue({
      teamId: 'team-1',
      deleted: true,
    });
  });

  it('팀 개수 카운트와 팀 추가 버튼을 렌더링한다', async () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamSettings bandId="band-1" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('총 2개의 팀')).toBeInTheDocument();
    expect(screen.getByText('팀 추가')).toBeInTheDocument();
  });

  it('체크박스를 선택하면 상단 버튼이 팀 삭제 버튼으로 전환된다', async () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamSettings bandId="band-1" />
      </QueryClientProvider>,
    );

    await screen.findByText('총 2개의 팀');

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // 1개 선택 시 "팀 삭제" 버튼 노출
    expect(screen.getByRole('button', { name: '팀 삭제' })).toBeInTheDocument();
    expect(screen.queryByText('팀 추가')).not.toBeInTheDocument();
  });

  it('팀 삭제 버튼 클릭 시 확인 다이얼로그를 띄우고 삭제를 진행한다', async () => {
    const deleteSpy = vi.spyOn(teamApi, 'deleteTeam');
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamSettings bandId="band-1" />
      </QueryClientProvider>,
    );

    await screen.findByText('총 2개의 팀');

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    // 상단 "팀 삭제" 버튼 클릭 -> 다이얼로그 오픈
    const deleteBtn = screen.getByRole('button', { name: '팀 삭제' });
    fireEvent.click(deleteBtn);

    // 다이얼로그 내용 확인
    expect(
      await screen.findByText('팀을 삭제하시겠습니까?'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('삭제된 팀은 복구가 불가능합니다.'),
    ).toBeInTheDocument();

    // 다이얼로그의 "삭제" 확인 버튼 클릭
    const confirmBtn = screen.getByRole('button', { name: '삭제' });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('team-1');
    });
  });
});

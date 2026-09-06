import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as teamApi from '@/entities/team/api/team-api';
import * as memberApi from '@/entities/member/api/member-api';
import type { BandMemberListItem } from '@/entities/member/model/types';
import { BandTeamCreateView } from './BandTeamCreateView';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

const MOCK_MEMBERS: BandMemberListItem[] = [
  {
    bandMemberId: 'm-1',
    userId: 'u-1',
    nickname: '김민준',
    avatarUrl: null,
    role: 'BM',
    joinedAt: '2026-01-01T00:00:00Z',
    skills: [
      {
        skillTypeId: 's-1',
        skillName: '보컬',
        skillLevel: 'ADVANCED',
        isPrimary: true,
      },
    ],
  },
  {
    bandMemberId: 'm-2',
    userId: 'u-2',
    nickname: '박지은',
    avatarUrl: null,
    role: 'MEMBER',
    joinedAt: '2026-01-02T00:00:00Z',
    skills: [
      {
        skillTypeId: 's-2',
        skillName: '베이스',
        skillLevel: 'ADVANCED',
        isPrimary: true,
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

describe('BandTeamCreateView', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    vi.spyOn(memberApi, 'getBandMembers').mockResolvedValue(MOCK_MEMBERS);
    vi.spyOn(teamApi, 'getBandTeams').mockResolvedValue([]);
    vi.spyOn(teamApi, 'createTeam').mockResolvedValue({
      teamId: 'team-new-1',
      name: '새로운 합주팀',
    });
    vi.spyOn(teamApi, 'addTeamMember').mockResolvedValue({
      teamMemberId: 'tm-new-1',
      bandMemberId: 'm-1',
      user: { userId: 'u-1', nickname: '김민준', profileImageUrl: null },
      teamRole: 'MEMBER',
      joinedAt: '2026-01-01T00:00:00Z',
      skills: [],
    });
  });

  it('팀 추가 폼 요소를 정상적으로 렌더링한다', () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCreateView bandId="band-1" />
      </QueryClientProvider>,
    );

    expect(screen.getByText('팀 추가')).toBeInTheDocument();
    expect(
      screen.getByText('밴드멤버들과 팀을 만들어 합주할 수 있어요'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('팀 이름')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '팀원 추가' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: '추가' });
    expect(submitBtn).toBeDisabled();
  });

  it('팀 이름을 입력하면 추가 버튼이 활성화된다', () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCreateView bandId="band-1" />
      </QueryClientProvider>,
    );

    const input = screen.getByLabelText('팀 이름');
    fireEvent.change(input, { target: { value: '어쿠스틱 세션' } });

    const submitBtn = screen.getByRole('button', { name: '추가' });
    expect(submitBtn).not.toBeDisabled();
  });

  it('기본값으로 팀 생성자(리더)가 등록되어 있으며 변경/삭제 버튼이 노출되지 않는다', async () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCreateView bandId="band-1" />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('보컬')).toBeInTheDocument();
    expect(screen.getByText('김민준')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '김민준 변경' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '김민준 제거' }),
    ).not.toBeInTheDocument();
  });

  it('추가된 팀원 행의 돋보기 버튼을 누르고 다른 멤버를 선택하면 해당 멤버로 교체된다', async () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCreateView bandId="band-1" />
      </QueryClientProvider>,
    );

    // 1. 박지은 멤버 추가
    const addMemberBtn = screen.getByRole('button', { name: '팀원 추가' });
    fireEvent.click(addMemberBtn);
    const memberItem = await screen.findByText('박지은');
    fireEvent.click(memberItem);
    const closeBtn = screen.getByRole('button', { name: '닫기' });
    fireEvent.click(closeBtn);

    expect(await screen.findByText('베이스')).toBeInTheDocument();

    // 2. 추가된 박지은 행의 돋보기(변경) 버튼 클릭
    const editBtn = screen.getByRole('button', { name: '박지은 변경' });
    fireEvent.click(editBtn);

    // 3. 모달에서 다른 멤버 선택 시 교체되고 모달 닫힘
    const newMemberItem = await screen.findByText('김민준');
    fireEvent.click(newMemberItem);
  });

  it('팀 생성 성공 시 createTeam 및 addTeamMember를 호출하고 팀 목록으로 이동한다', async () => {
    const createSpy = vi.spyOn(teamApi, 'createTeam');
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCreateView bandId="band-1" />
      </QueryClientProvider>,
    );

    const input = screen.getByLabelText('팀 이름');
    fireEvent.change(input, { target: { value: '새로운 합주팀' } });

    const submitBtn = screen.getByRole('button', { name: '추가' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith('band-1', {
        name: '새로운 합주팀',
      });
      expect(mockNavigate).toHaveBeenCalledWith({
        to: '/band/$bandId/settings',
        params: { bandId: 'band-1' },
        search: { tab: 'teams' },
      });
    });
  });

  it('취소 버튼 클릭 시 밴드 설정 팀 탭으로 이동한다', () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCreateView bandId="band-1" />
      </QueryClientProvider>,
    );

    const cancelBtn = screen.getByRole('button', { name: '취소' });
    fireEvent.click(cancelBtn);

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/band/$bandId/settings',
      params: { bandId: 'band-1' },
      search: { tab: 'teams' },
    });
  });
});

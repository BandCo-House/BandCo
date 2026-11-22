import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as teamApi from '@/entities/team/api/team-api';
import * as memberApi from '@/entities/member/api/member-api';
import type { BandMemberListItem } from '@/entities/member/model/types';
import { BandTeamCreateView } from './BandTeamCreateView';

const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  // 검색 결과 줄의 프로필 링크가 라우터 컨텍스트를 요구한다. 이동 자체는 여기서 보는 게 아니라 평범한 a로 둔다.
  Link: ({
    to,
    children,
    'aria-label': ariaLabel,
  }: {
    to: string;
    children: React.ReactNode;
    'aria-label'?: string;
  }) => (
    <a href={to} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

const MOCK_MEMBERS: BandMemberListItem[] = [
  {
    bandMemberId: 'm-1',
    userId: 'u-1',
    nickname: '김민준',
    handle: 'handle_1',
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
    handle: 'handle_2',
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
    // 서버는 팀을 만들면서 로그인한 멤버를 리더 행으로 미리 넣어 둔다.
    vi.spyOn(teamApi, 'getTeamMembers').mockResolvedValue([
      {
        teamMemberId: 'tm-leader',
        bandMemberId: 'm-1',
        user: { userId: 'u-1', nickname: '김민준', profileImageUrl: null },
        teamRole: 'LEADER',
        joinedAt: '2026-01-01T00:00:00Z',
        skillType: null,
        skills: [],
      },
    ]);
    vi.spyOn(teamApi, 'replaceTeamMembers').mockResolvedValue([]);
    // Radix Select가 열릴 때 옵션으로 스크롤한다. jsdom에는 없는 API다.
    Element.prototype.scrollIntoView = vi.fn();
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

    expect(
      await screen.findByRole('combobox', { name: '김민준 세션 선택' }),
    ).toBeInTheDocument();
    expect(screen.getByText('김민준')).toBeInTheDocument();
    // 보유 스킬(보컬)을 팀 세션처럼 미리 채우지 않는다.
    expect(screen.queryByText('보컬')).not.toBeInTheDocument();
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

    expect(
      await screen.findByRole('combobox', { name: '박지은 세션 선택' }),
    ).toBeInTheDocument();

    // 2. 추가된 박지은 행의 돋보기(변경) 버튼 클릭
    const editBtn = screen.getByRole('button', { name: '박지은 변경' });
    fireEvent.click(editBtn);

    // 3. 모달에서 다른 멤버 선택 시 교체되고 모달 닫힘 (팀원 행에도 같은 닉네임이 있으므로 모달 안에서 찾는다)
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(await within(dialog).findByText('김민준'));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(screen.queryByText('박지은')).not.toBeInTheDocument();
  });

  it('팀 생성 성공 시 createTeam을 호출하고 팀 목록으로 이동한다', async () => {
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

  it('고른 세션을 리더 행을 이어받은 명단으로 저장한다', async () => {
    const replaceSpy = vi.spyOn(teamApi, 'replaceTeamMembers');
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <BandTeamCreateView bandId="band-1" />
      </QueryClientProvider>,
    );

    // 박지은 추가
    fireEvent.click(screen.getByRole('button', { name: '팀원 추가' }));
    fireEvent.click(await screen.findByText('박지은'));
    fireEvent.click(screen.getByRole('button', { name: '닫기' }));

    // 리더(김민준) 세션을 보컬로
    const trigger = await screen.findByRole('combobox', {
      name: '김민준 세션 선택',
    });
    await waitFor(() => expect(trigger).not.toBeDisabled());
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(await screen.findByRole('option', { name: '보컬' }), {
      key: 'Enter',
    });

    fireEvent.change(screen.getByLabelText('팀 이름'), {
      target: { value: '새로운 합주팀' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() =>
      expect(replaceSpy).toHaveBeenCalledWith('team-new-1', [
        {
          teamMemberId: 'tm-leader',
          bandMemberId: 'm-1',
          skillTypeId: 'vocal-1',
        },
        { bandMemberId: 'm-2', skillTypeId: null },
      ]),
    );
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

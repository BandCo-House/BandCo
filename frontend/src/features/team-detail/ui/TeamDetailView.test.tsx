import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { TeamDetailView } from './TeamDetailView';
import type { TeamDetail, TeamMember } from '@/entities/team/model/types';

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    Link: ({ children, ...props }: ComponentPropsWithoutRef<'a'>) => (
      <a {...props}>{children}</a>
    ),
  };
});

const MOCK_TEAM: TeamDetail = {
  teamId: 'team-1',
  bandId: 'band-1',
  name: '듀얼 기타 편성',
  description: '테스트 팀 설명',
  status: 'ACTIVE',
  teamCoverUrl: null,
  teamLeader: { userId: 'u-1', nickname: '김기타' },
  memberCount: 2,
};

const MOCK_MEMBERS: TeamMember[] = [
  {
    teamMemberId: 'tm-1',
    bandMemberId: 'bm-1',
    user: {
      userId: 'u-1',
      nickname: '김기타',
      profileImageUrl: null,
    },
    teamRole: 'LEADER',
    skills: [
      {
        skillTypeId: 'st-guitar',
        skillName: '기타',
        skillLevel: 'ADVANCED',
        isPrimary: true,
      },
    ],
  },
  {
    teamMemberId: 'tm-2',
    bandMemberId: 'bm-2',
    user: { userId: 'u-2', nickname: '이베이스', profileImageUrl: null },
    teamRole: 'MEMBER',
    skills: [
      {
        skillTypeId: 'st-bass',
        skillName: '베이스',
        skillLevel: 'ADVANCED',
        isPrimary: true,
      },
    ],
  },
];

// 세션 선택 드롭다운이 useSkillTypes(useQuery)를 쓰므로 Provider가 필요하다.
const renderWithQuery = (ui: ReactNode) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {ui}
    </QueryClientProvider>,
  );

describe('TeamDetailView', () => {
  const defaultProps = {
    team: MOCK_TEAM,
    members: MOCK_MEMBERS,
    onToggleEdit: vi.fn(),
    onOpenSearchForSession: vi.fn(),
    onOpenSearchForNewMember: vi.fn(),
    searchModalOpen: false,
    setSearchModalOpen: vi.fn(),
    handleToggleMember: vi.fn(),
  };

  it('팀원 목록, 합주 공간 섹션을 올바르게 렌더링한다', () => {
    renderWithQuery(<TeamDetailView {...defaultProps} />);

    expect(screen.getByText('듀얼 기타 편성')).toBeInTheDocument();
    expect(screen.getByText('팀원 목록')).toBeInTheDocument();
    expect(screen.getByText('참여중인 합주 공간')).toBeInTheDocument();

    expect(screen.getByText('기타:')).toBeInTheDocument();
    expect(screen.getByText('김기타')).toBeInTheDocument();
    expect(screen.getByText('베이스:')).toBeInTheDocument();
    expect(screen.getByText('이베이스')).toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 onToggleEdit 콜백을 호출한다', () => {
    const handleToggleEdit = vi.fn();
    renderWithQuery(
      <TeamDetailView {...defaultProps} onToggleEdit={handleToggleEdit} />,
    );

    const editBtn = screen.getByRole('button', { name: '팀원 수정' });
    fireEvent.click(editBtn);
    expect(handleToggleEdit).toHaveBeenCalledTimes(1);
  });

  it('isEditing이 true일 때 팀원 추가 버튼 및 세션 검색 돋보기 버튼만 노출되고 합주 공간/곡/파일 섹션은 숨겨진다', () => {
    renderWithQuery(<TeamDetailView {...defaultProps} isEditing={true} />);

    expect(
      screen.getByRole('button', { name: '팀원 추가' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '기타 멤버 변경' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '베이스 멤버 변경' }),
    ).toBeInTheDocument();

    expect(screen.queryByText('참여중인 합주 공간')).not.toBeInTheDocument();
  });
});

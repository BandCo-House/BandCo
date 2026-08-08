import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TeamDetailView } from './TeamDetailView';
import type { TeamDetail, TeamMember } from '@/entities/team/model/types';

const MOCK_TEAM: TeamDetail = {
  teamId: 'team-1',
  bandId: 'band-1',
  name: '보컬팀',
  description: '여자 보컬 중심 팀',
  status: 'ACTIVE',
  teamCoverUrl: null,
  teamLeader: { userId: 'user-1', nickname: 'Jun' },
  memberCount: 4,
};

const MOCK_MEMBERS: TeamMember[] = [
  {
    teamMemberId: 'tm-1',
    bandMemberId: 'bm-1',
    user: { userId: 'u-1', nickname: '김기타', profileImageUrl: null },
    teamRole: 'LEADER',
    sessionName: '기타',
  },
  {
    teamMemberId: 'tm-2',
    bandMemberId: 'bm-2',
    user: { userId: 'u-2', nickname: '이베이스', profileImageUrl: null },
    teamRole: 'MEMBER',
    sessionName: '베이스',
  },
];

describe('TeamDetailView', () => {
  it('팀 헤더 및 섹션(팀원 목록, 합주 공간, 합주곡, 팀 파일)을 올바르게 렌더링한다', () => {
    render(
      <TeamDetailView
        team={MOCK_TEAM}
        members={MOCK_MEMBERS}
        onDeleteTeam={vi.fn()}
        onEditMembers={vi.fn()}
      />,
    );

    expect(screen.getByText('팀원 목록')).toBeInTheDocument();
    expect(screen.getByText('참여중인 합주 공간')).toBeInTheDocument();
    expect(screen.getByText('합주곡')).toBeInTheDocument();
    expect(screen.getByText('팀 파일')).toBeInTheDocument();

    expect(screen.getByText('기타:')).toBeInTheDocument();
    expect(screen.getByText('김기타')).toBeInTheDocument();
    expect(screen.getByText('베이스:')).toBeInTheDocument();
    expect(screen.getByText('이베이스')).toBeInTheDocument();
  });

  it('팀 삭제 버튼 클릭 시 onDeleteTeam 콜백을 호출한다', () => {
    const handleDelete = vi.fn();
    render(
      <TeamDetailView
        team={MOCK_TEAM}
        members={MOCK_MEMBERS}
        onDeleteTeam={handleDelete}
        onEditMembers={vi.fn()}
      />,
    );

    const deleteBtn = screen.getByRole('button', { name: '팀 삭제' });
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('팀원 수정 버튼 클릭 시 onEditMembers 콜백을 호출한다', () => {
    const handleEdit = vi.fn();
    render(
      <TeamDetailView
        team={MOCK_TEAM}
        members={MOCK_MEMBERS}
        onDeleteTeam={vi.fn()}
        onEditMembers={handleEdit}
      />,
    );

    const editBtn = screen.getByRole('button', { name: '팀원 수정' });
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });
});


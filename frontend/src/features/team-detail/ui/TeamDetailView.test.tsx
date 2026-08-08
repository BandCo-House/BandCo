import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TeamDetailView } from './TeamDetailView';
import type { TeamDetail, TeamMember } from '@/entities/team/model/types';

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
  it('팀원 목록, 합주 공간, 합주곡, 팀 파일 섹션을 올바르게 렌더링한다', () => {
    render(
      <TeamDetailView
        team={MOCK_TEAM}
        members={MOCK_MEMBERS}
        onDeleteTeam={vi.fn()}
        onToggleEdit={vi.fn()}
      />,
    );

    expect(screen.getByText('듀얼 기타 편성')).toBeInTheDocument();
    expect(screen.getByText('팀원 목록')).toBeInTheDocument();
    expect(screen.getByText('참여중인 합주 공간')).toBeInTheDocument();
    expect(screen.getByText('합주곡')).toBeInTheDocument();
    expect(screen.getByText('팀 파일')).toBeInTheDocument();

    expect(screen.getByText('기타:')).toBeInTheDocument();
    expect(screen.getByText('김기타')).toBeInTheDocument();
    expect(screen.getByText('베이스:')).toBeInTheDocument();
    expect(screen.getByText('이베이스')).toBeInTheDocument();
  });

  it('수정 버튼 클릭 시 onToggleEdit 콜백을 호출한다', () => {
    const handleToggleEdit = vi.fn();
    render(
      <TeamDetailView
        team={MOCK_TEAM}
        members={MOCK_MEMBERS}
        onDeleteTeam={vi.fn()}
        onToggleEdit={handleToggleEdit}
      />,
    );

    const editBtn = screen.getByRole('button', { name: '팀원 수정' });
    fireEvent.click(editBtn);
    expect(handleToggleEdit).toHaveBeenCalledTimes(1);
  });

  it('isEditing이 true일 때 팀원 추가 버튼과 세션별 검색 돋보기 버튼이 노출된다', () => {
    render(
      <TeamDetailView
        team={MOCK_TEAM}
        members={MOCK_MEMBERS}
        isEditing={true}
        onDeleteTeam={vi.fn()}
        onSaveMembers={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '팀원 추가' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기타 멤버 변경' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '베이스 멤버 변경' })).toBeInTheDocument();
  });
});

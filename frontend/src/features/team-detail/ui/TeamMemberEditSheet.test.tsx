import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TeamMemberEditSheet } from './TeamMemberEditSheet';
import type { TeamMember } from '@/entities/team/model/types';

const MOCK_MEMBERS: TeamMember[] = [
  {
    teamMemberId: 'tm-1',
    bandMemberId: 'bm-1',
    user: { userId: 'u-1', nickname: '김기타', profileImageUrl: null },
    teamRole: 'LEADER',
    sessionName: '기타',
  },
];

describe('TeamMemberEditSheet', () => {
  it('팀원 수정 시트 타이틀과 완료(저장) 버튼을 올바르게 렌더링한다', () => {
    render(
      <TeamMemberEditSheet
        open={true}
        bandId="band-1"
        members={MOCK_MEMBERS}
        onOpenChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText('팀원 수정')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '완료' })).toBeInTheDocument();
    expect(screen.getByText('김기타')).toBeInTheDocument();
  });

  it('완료 버튼 클릭 시 onSave 콜백을 호출한다', () => {
    const handleSave = vi.fn();
    render(
      <TeamMemberEditSheet
        open={true}
        bandId="band-1"
        members={MOCK_MEMBERS}
        onOpenChange={vi.fn()}
        onSave={handleSave}
      />,
    );

    const saveBtn = screen.getByRole('button', { name: '완료' });
    fireEvent.click(saveBtn);
    expect(handleSave).toHaveBeenCalledTimes(1);
  });
});

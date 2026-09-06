import React from 'react';
import { MemberSearchModal } from '@/features/schedule-create/ui/components/MemberSearchModal';
import { TeamDetailSubHeader } from './components/TeamDetailSubHeader';
import { TeamMemberListSection } from './components/TeamMemberListSection';
import { TeamPracticeSpaceSection } from './components/TeamPracticeSpaceSection';
import type { BandMemberListItem } from '@/entities/member/model/types';
import type { TeamDetail, TeamMember } from '@/entities/team/model/types';

interface TeamDetailViewProps {
  team: TeamDetail;
  members: TeamMember[];
  isEditing?: boolean;
  bandId?: string;
  onToggleEdit?: () => void;
  onOpenSearchForSession: (index: number) => void;
  onOpenSearchForNewMember: () => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  handleToggleMember: (member: BandMemberListItem) => void;
}

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({
  team,
  members,
  isEditing = false,
  bandId = '',
  onToggleEdit,
  onOpenSearchForSession,
  onOpenSearchForNewMember,
  searchModalOpen,
  setSearchModalOpen,
  handleToggleMember,
}) => {
  return (
    <div className="-mt-1 flex flex-col gap-4 px-5 pt-0 pb-8 text-foreground">
      {/* 1. 서브 헤더 */}
      <TeamDetailSubHeader
        teamName={team.name}
        isEditing={isEditing}
        onOpenSearchModal={onOpenSearchForNewMember}
      />

      {/* 2. 팀원 목록 카드 (피그마 100% 매칭) */}
      <TeamMemberListSection
        members={members}
        isEditing={isEditing}
        onToggleEdit={onToggleEdit}
        onOpenSearchForSession={onOpenSearchForSession}
        onOpenSearchForNewMember={onOpenSearchForNewMember}
      />

      {/* 3. 합주 공간, 합주곡, 팀 파일 섹션 (수정 모드 시 숨김) */}
      {!isEditing && (
        <>
          <TeamPracticeSpaceSection bandId={bandId} />
        </>
      )}

      {/* 멤버 검색 모달 */}
      {searchModalOpen && (
        <MemberSearchModal
          open={searchModalOpen}
          onOpenChange={setSearchModalOpen}
          bandId={bandId}
          selectedIds={members.map((m) => m.bandMemberId)}
          onToggleMember={handleToggleMember}
        />
      )}
    </div>
  );
};

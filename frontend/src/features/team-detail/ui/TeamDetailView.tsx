import React from 'react';
import { MemberSearchModal } from '@/features/schedule-create/ui/components/MemberSearchModal';
import { useTeamMemberEdit } from '../model/useTeamMemberEdit';
import { TeamDetailSubHeader } from './components/TeamDetailSubHeader';
import { TeamMemberListSection } from './components/TeamMemberListSection';
import { TeamPracticeSpaceSection } from './components/TeamPracticeSpaceSection';
import { TeamSongSection } from './components/TeamSongSection';
import { TeamFileSection } from './components/TeamFileSection';
import type { TeamDetail, TeamMember } from '@/entities/team/model/types';

interface TeamDetailViewProps {
  team: TeamDetail;
  members: TeamMember[];
  isEditing?: boolean;
  bandId?: string;
  onToggleEdit?: () => void;
  onSaveMembers?: (updatedMembers: TeamMember[]) => void;
  onDeleteTeam: () => void;
}

export const TeamDetailView: React.FC<TeamDetailViewProps> = ({
  team,
  members: propMembers,
  isEditing = false,
  bandId = '',
  onToggleEdit,
}) => {
  const {
    currentMembers,
    searchModalOpen,
    setSearchModalOpen,
    handleToggleMember,
    handleOpenSearchForSession,
    handleOpenSearchForNewMember,
  } = useTeamMemberEdit({ propMembers });

  return (
    <div className="flex flex-col gap-4 px-5 pt-0 -mt-1 pb-8 text-foreground">
      {/* 1. 서브 헤더 */}
      <TeamDetailSubHeader
        teamName={team.name}
        isEditing={isEditing}
        onOpenSearchModal={handleOpenSearchForNewMember}
      />

      {/* 2. 팀원 목록 카드 (피그마 100% 매칭) */}
      <TeamMemberListSection
        members={currentMembers}
        isEditing={isEditing}
        onToggleEdit={onToggleEdit}
        onOpenSearchForSession={handleOpenSearchForSession}
        onOpenSearchForNewMember={handleOpenSearchForNewMember}
      />

      {/* 3. 합주 공간, 합주곡, 팀 파일 섹션 (수정 모드 시 숨김) */}
      {!isEditing && (
        <>
          <TeamPracticeSpaceSection />
          <TeamSongSection />
          <TeamFileSection />
        </>
      )}

      {/* 멤버 검색 모달 */}
      {searchModalOpen && (
        <MemberSearchModal
          open={searchModalOpen}
          onOpenChange={setSearchModalOpen}
          bandId={bandId}
          selectedIds={currentMembers.map((m) => m.bandMemberId)}
          onToggleMember={handleToggleMember}
        />
      )}
    </div>
  );
};

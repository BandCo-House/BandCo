import { useState } from 'react';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import { TeamDetailView, TeamMemberEditSheet } from '@/features/team-detail';
import { useTeamDetail, useTeamMembers } from '@/entities/team/api/queries';
import { deleteTeam } from '@/entities/team/api/team-api';
import type { TeamMember } from '@/entities/team/model/types';

export const Route = createFileRoute('/song/$songId/team/$teamId')({
  component: TeamDetailRoutePage,
  staticData: {
    header: {
      title: '팀 상세',
      backTo: '/song/$songId/teams',
      getBackParams: (params: Record<string, string>) => ({
        songId: params.songId,
      }),
    },
  },
});

// 팀 상세 라우트 전용 화면 (MSW & React Query 연동)
function TeamDetailRoutePage() {
  const { teamId } = useParams({ from: '/song/$songId/team/$teamId' });
  const { data: team, isLoading: teamLoading } = useTeamDetail(teamId);
  const { data: members = [], refetch: refetchMembers } = useTeamMembers(teamId);

  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam(teamId);
      toast.success('팀이 삭제되었습니다.');
    } catch {
      toast.error('팀 삭제 실패');
    }
  };

  const handleSaveMembers = (updated: TeamMember[]) => {
    refetchMembers();
    toast.success('팀원 목록이 업데이트되었습니다!');
  };

  if (teamLoading || !team) {
    return (
      <div className="py-12 text-center typo-sm-r text-grey-300">
        팀 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="pb-12">
      <TeamDetailView
        team={team}
        members={members}
        onDeleteTeam={handleDeleteTeam}
        onEditMembers={() => setEditSheetOpen(true)}
      />

      <TeamMemberEditSheet
        open={editSheetOpen}
        bandId={team.bandId}
        members={members}
        onOpenChange={setEditSheetOpen}
        onSave={handleSaveMembers}
      />
    </div>
  );
}



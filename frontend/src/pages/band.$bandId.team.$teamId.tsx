import { useState } from 'react';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import { TeamDetailView } from '@/features/team-detail/ui/TeamDetailView';
import { useTeamDetail, useTeamMembers } from '@/entities/team/api/queries';
import { deleteTeam } from '@/entities/team/api/team-api';
import type { TeamMember } from '@/entities/team/model/types';

export const Route = createFileRoute('/band/$bandId/team/$teamId')({
  component: BandTeamDetailRoutePage,
  staticData: {
    header: {
      title: '팀 상세',
      backTo: '/band/$bandId/settings',
      getBackParams: (params: Record<string, string>) => ({
        bandId: params.bandId,
      }),
    },
  },
});

function BandTeamDetailRoutePage() {
  const { teamId, bandId } = useParams({ from: '/band/$bandId/team/$teamId' });
  const { data: team, isLoading: teamLoading } = useTeamDetail(teamId);
  const { data: initialMembers = [], refetch: refetchMembers } = useTeamMembers(teamId);

  const [isEditing, setIsEditing] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);

  const handleDeleteTeam = async () => {
    try {
      await deleteTeam(teamId);
      toast.success('팀이 삭제되었습니다.');
    } catch {
      toast.error('팀 삭제 실패');
    }
  };

  const handleSaveMembers = (updatedMembers: TeamMember[]) => {
    setMembers(updatedMembers);
    setIsEditing(false);
    toast.success('팀원 설정이 완료되었습니다.');
    refetchMembers();
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
        members={members.length > 0 ? members : initialMembers}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing((prev) => !prev)}
        onSaveMembers={handleSaveMembers}
        onDeleteTeam={handleDeleteTeam}
        bandId={bandId}
      />
    </div>
  );
}

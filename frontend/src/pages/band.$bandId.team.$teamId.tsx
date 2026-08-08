import { useState, useEffect, useCallback } from 'react';
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { toast } from 'sonner';
import { Trash2, Check } from 'lucide-react';
import { TeamDetailView } from '@/features/team-detail/ui/TeamDetailView';
import { useTeamDetail, useTeamMembers } from '@/entities/team/api/queries';
import { deleteTeam } from '@/entities/team/api/team-api';
import {
  updateTeamHeader,
  useTeamHeaderState,
} from '@/entities/team/model/team-header-state';
import type { TeamMember } from '@/entities/team/model/types';

const searchSchema = z.object({
  mode: z.enum(['read', 'edit']).optional(),
});

export const Route = createFileRoute('/band/$bandId/team/$teamId')({
  validateSearch: searchSchema,
  component: BandTeamDetailRoutePage,
  staticData: {
    header: {
      title: HeaderTitle,
      backBehavior: 'browser',
      renderRight: () => <HeaderRightAction />,
    },
  },
});

/** 최상단 공통 RouteHeader에 동적으로 반영되는 옵저버 타이틀 렌더러 */
function HeaderTitle() {
  const { isEditing } = useTeamHeaderState();
  return (
    <h1 className="min-w-0 truncate text-grey-50 typo-xl-sb">
      {isEditing ? '팀원 수정' : '팀 상세'}
    </h1>
  );
}

/** 최상단 공통 RouteHeader에 바인딩되는 옵저버 우측 액션 렌더러 */
function HeaderRightAction() {
  const { isEditing, onDeleteTeam, onSaveMembers } = useTeamHeaderState();

  if (isEditing) {
    return (
      <button
        type="button"
        onClick={() => onSaveMembers?.()}
        aria-label="저장"
        className="flex items-center gap-1.5 typo-xs-m text-grey-300 hover:text-foreground transition-colors"
      >
        <span>저장</span>
        <Check className="h-4 w-4 text-secondary" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onDeleteTeam?.()}
      aria-label="팀 삭제"
      className="flex items-center gap-1.5 typo-xs-m text-grey-300 hover:text-destructive transition-colors"
    >
      <span>팀 삭제</span>
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function BandTeamDetailRoutePage() {
  const { teamId, bandId } = useParams({ from: '/band/$bandId/team/$teamId' });
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/band/$bandId/team/$teamId' });

  const isEditing = search.mode === 'edit';

  const { data: team, isLoading: teamLoading } = useTeamDetail(teamId);
  const { data: initialMembers = [], refetch: refetchMembers } = useTeamMembers(teamId);

  const [members, setMembers] = useState<TeamMember[]>(initialMembers);

  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const handleDeleteTeam = useCallback(async () => {
    try {
      await deleteTeam(teamId);
      toast.success('팀이 삭제되었습니다.');
      navigate({
        to: '/band/$bandId/settings',
        params: { bandId },
      });
    } catch {
      toast.error('팀 삭제 실패');
    }
  }, [teamId, bandId, navigate]);

  const handleSaveMembers = useCallback(
    (updatedMembers: TeamMember[]) => {
      setMembers(updatedMembers);
      toast.success('팀원 설정이 저장되었습니다.');
      refetchMembers();
      navigate({
        search: {},
      });
    },
    [refetchMembers, navigate],
  );

  const handleToggleEdit = useCallback(() => {
    navigate({
      search: { mode: 'edit' },
    });
  }, [navigate]);

  // 펍섭(옵저버) 상태를 페이지 상태와 동기화 (알람 패턴과 동일)
  useEffect(() => {
    updateTeamHeader({
      isEditing,
      onDeleteTeam: handleDeleteTeam,
      onSaveMembers: () => handleSaveMembers(members),
      onToggleEdit: handleToggleEdit,
    });
  }, [
    isEditing,
    members,
    handleDeleteTeam,
    handleSaveMembers,
    handleToggleEdit,
  ]);

  // 언마운트 시 헤더 상태 클린업 (알람 NotificationList 패턴 100% 동일 적용)
  useEffect(() => {
    return () => {
      updateTeamHeader({
        isEditing: false,
        onDeleteTeam: undefined,
        onSaveMembers: undefined,
        onToggleEdit: undefined,
      });
    };
  }, []);

  if (teamLoading || !team) {
    return (
      <div className="py-12 text-center typo-sm-r text-grey-300">
        팀 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="pb-12 pt-0">
      <TeamDetailView
        team={team}
        members={members.length > 0 ? members : initialMembers}
        isEditing={isEditing}
        onToggleEdit={handleToggleEdit}
        onSaveMembers={handleSaveMembers}
        onDeleteTeam={handleDeleteTeam}
        bandId={bandId}
      />
    </div>
  );
}

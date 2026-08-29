import { useState, useEffect, useCallback } from 'react';
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { toast } from 'sonner';
import { Trash2, Check, Loader2 } from 'lucide-react';
import { TeamDetailView } from '@/features/team-detail/ui/TeamDetailView';
import { useTeamMemberEdit } from '@/features/team-detail/model/useTeamMemberEdit';
import { useQueryClient } from '@tanstack/react-query';
import {
  teamKeys,
  useTeamDetail,
  useTeamMembers,
  useAddTeamMember,
  useRemoveTeamMember,
} from '@/entities/team/api/queries';
import { deleteTeam } from '@/entities/team/api/team-api';
import {
  updateTeamHeader,
  useTeamHeaderState,
} from '@/entities/team/model/team-header-state';

import { ConfirmDialog } from '@/shared/ui/confirm-dialog';

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
  const { isEditing, isSaving, onDeleteTeam, onSaveMembers } = useTeamHeaderState();

  if (isEditing) {
    return (
      <button
        type="button"
        onClick={() => onSaveMembers?.()}
        disabled={isSaving}
        aria-label="저장"
        className="flex items-center gap-1.5 typo-xs-m text-grey-300 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isSaving ? '저장 중...' : '저장'}</span>
        {isSaving
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <Check className="h-4 w-4 text-secondary" />}
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
  const { data: initialMembers = [] } = useTeamMembers(teamId);

  const {
    currentMembers,
    searchModalOpen,
    setSearchModalOpen,
    handleToggleMember,
    handleOpenSearchForSession,
    handleOpenSearchForNewMember,
  } = useTeamMemberEdit({ propMembers: initialMembers });

  const { mutateAsync: addMember } = useAddTeamMember(teamId);
  const { mutateAsync: removeMember } = useRemoveTeamMember(teamId);
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleDeleteTeam = useCallback(async () => {
    try {
      await deleteTeam(teamId);
      toast.success('팀이 삭제되었습니다.');
      setIsDeleteOpen(false);
      await queryClient.invalidateQueries({ queryKey: teamKeys.all });
      navigate({
        to: '/band/$bandId/settings',
        params: { bandId },
        search: { tab: 'teams' },
      });
    } catch {
      toast.error('팀 삭제 실패');
    }
  }, [teamId, bandId, navigate, queryClient]);

  const handleSaveMembers = useCallback(async () => {
    setIsSaving(true);
    try {
      const originalIds = new Set(initialMembers.map((m) => m.bandMemberId));
      const updatedIds = new Set(currentMembers.map((m) => m.bandMemberId));

      // 제거된 멤버: 원본에 있고 편집 후에 없는 것
      const toRemove = initialMembers.filter(
        (m) => !updatedIds.has(m.bandMemberId),
      );
      // 추가된 멤버: 편집 후에 있고 원본에 없는 것
      const toAdd = currentMembers.filter(
        (m) => !originalIds.has(m.bandMemberId),
      );

      await Promise.all([
        ...toRemove.map((m) => removeMember(m.teamMemberId)),
        ...toAdd.map((m) => addMember(m.bandMemberId)),
      ]);

      toast.success('팀원 설정이 저장되었습니다.');
      navigate({ search: {} });
    } catch {
      toast.error('팀원 저장에 실패했어요.');
    } finally {
      setIsSaving(false);
    }
  }, [initialMembers, currentMembers, addMember, removeMember, navigate]);

  const handleToggleEdit = useCallback(() => {
    navigate({
      search: { mode: 'edit' },
    });
  }, [navigate]);

  // 펍섭(옵저버) 상태를 페이지 상태와 동기화
  useEffect(() => {
    updateTeamHeader({
      isEditing,
      isSaving,
      onDeleteTeam: () => setIsDeleteOpen(true),
      onSaveMembers: () => void handleSaveMembers(),
      onToggleEdit: handleToggleEdit,
    });
  }, [
    isEditing,
    isSaving,
    handleSaveMembers,
    handleToggleEdit,
  ]);

  // 언마운트 시 헤더 상태 클린업
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
        key={isEditing ? 'edit' : 'read'}
        team={team}
        members={isEditing ? currentMembers : initialMembers}
        isEditing={isEditing}
        onToggleEdit={handleToggleEdit}
        onOpenSearchForSession={handleOpenSearchForSession}
        onOpenSearchForNewMember={handleOpenSearchForNewMember}
        searchModalOpen={searchModalOpen}
        setSearchModalOpen={setSearchModalOpen}
        handleToggleMember={handleToggleMember}
        bandId={bandId}
      />

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="팀을 삭제하시겠습니까?"
        description="삭제된 팀은 복구가 불가능합니다."
        confirmLabel="삭제"
        onConfirm={handleDeleteTeam}
      />
    </div>
  );
}

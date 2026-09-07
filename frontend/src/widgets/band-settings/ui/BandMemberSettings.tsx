import React, { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  kickBandMember,
  updateBandMemberRole,
} from '@/entities/member/api/member-api';
import {
  memberKeys,
  useBandMembers,
} from '@/entities/member/api/useBandMembers';
import type {
  BandMemberListItem,
  BandMemberRole,
} from '@/entities/member/model/types';
import { useBandTeams } from '@/entities/team/api/queries';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { setBandSettingsSaveAction } from '../model/save-action-store';
import { BandGeneralMemberSection } from './BandGeneralMemberSection';
import { BandLeaderSection } from './BandLeaderSection';
import { MEMBER_PICKER_TAKE } from '@/shared/lib/member-picker';

interface BandMemberSettingsProps {
  bandId: string;
}

export const BandMemberSettings: React.FC<BandMemberSettingsProps> = ({
  bandId,
}) => {
  const queryClient = useQueryClient();
  const { data: rawMembers = [], isLoading } = useBandMembers(bandId, {
    take: MEMBER_PICKER_TAKE,
  });
  const { data: teams = [] } = useBandTeams(bandId);

  const [roleDrafts, setRoleDrafts] = useState<Map<string, BandMemberRole>>(
    new Map(),
  );
  const [showTeamLeaders, setShowTeamLeaders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [kickTarget, setKickTarget] = useState<BandMemberListItem | null>(null);

  // 초깃값과 draft를 합성한 멤버 리스트
  const members = useMemo(() => {
    return rawMembers.map((m) => {
      const draftRole = roleDrafts.get(m.userId);
      return draftRole ? { ...m, role: draftRole } : m;
    });
  }, [rawMembers, roleDrafts]);

  // 리더, 부리더, 일반 멤버 분류
  const leader = useMemo(() => members.find((m) => m.role === 'BM'), [members]);
  const subLeaders = useMemo(
    () => members.filter((m) => m.role === 'ADMIN'),
    [members],
  );
  const generalMembers = useMemo(
    () => members.filter((m) => m.role === 'MEMBER'),
    [members],
  );

  const handleRoleChange = (userId: string, newRole: BandMemberRole) => {
    const originalMember = rawMembers.find((m) => m.userId === userId);
    setRoleDrafts((prev) => {
      const next = new Map(prev);
      if (originalMember && originalMember.role === newRole) {
        next.delete(userId);
      } else {
        next.set(userId, newRole);
      }
      return next;
    });
  };

  const handleSaveRoles = async () => {
    if (roleDrafts.size === 0 || isSaving) return;

    setIsSaving(true);
    try {
      await Promise.all(
        Array.from(roleDrafts.entries()).map(([userId, role]) =>
          updateBandMemberRole(bandId, userId, role),
        ),
      );
      toast.success('멤버 권한 설정이 저장되었습니다.');
      await queryClient.invalidateQueries({ queryKey: memberKeys.all });
      setRoleDrafts(new Map());
    } catch {
      toast.error('멤버 권한 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKickConfirm = async () => {
    if (!kickTarget) return;

    try {
      await kickBandMember(bandId, kickTarget.userId);
      toast.success(`${kickTarget.nickname} 멤버를 내보냈습니다.`);
      setKickTarget(null);
      void queryClient.invalidateQueries({ queryKey: memberKeys.all });
    } catch {
      toast.error('멤버 강퇴 중 오류가 발생했습니다.');
    }
  };

  // 헤더 우측 저장 액션과 draft 상태 동기화
  useEffect(() => {
    setBandSettingsSaveAction({
      canSave: roleDrafts.size > 0,
      isSaving,
      save: () => void handleSaveRoles(),
    });
  }, [roleDrafts, isSaving]);

  // 언마운트 시 헤더 액션 클린업
  useEffect(() => {
    return () => {
      setBandSettingsSaveAction(null);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="py-10 text-center typo-sm-r text-grey-300">
        멤버 정보를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 px-5 py-4 text-foreground">
      {/* 1. 리더 멤버 섹션 */}
      <BandLeaderSection
        bandId={bandId}
        leader={leader}
        subLeaders={subLeaders}
        generalMembers={generalMembers}
        teams={teams}
        showTeamLeaders={showTeamLeaders}
        onToggleShowTeamLeaders={setShowTeamLeaders}
        onRoleChange={handleRoleChange}
      />

      {/* 2. 구분선 */}
      <hr className="border-t border-[#65637a]/30" />

      {/* 3. 일반 멤버 섹션 */}
      <BandGeneralMemberSection
        members={generalMembers}
        onRoleChange={handleRoleChange}
        onKick={(member) => setKickTarget(member)}
      />

      {/* 4. 강퇴 확인 다이얼로그 */}
      <ConfirmDialog
        open={kickTarget !== null}
        onOpenChange={(open) => {
          if (!open) setKickTarget(null);
        }}
        title="멤버를 내보낼까요?"
        description={
          kickTarget
            ? `${kickTarget.nickname} 멤버를 밴드에서 내보냅니다. 다시 참여하려면 초대가 필요합니다.`
            : ''
        }
        confirmLabel="내보내기"
        onConfirm={handleKickConfirm}
      />
    </div>
  );
};

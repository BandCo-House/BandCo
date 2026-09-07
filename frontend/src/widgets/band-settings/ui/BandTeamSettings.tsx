import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { teamKeys, useBandTeams } from '@/entities/team/api/queries';
import { deleteTeam } from '@/entities/team/api/team-api';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { BandTeamCard } from './BandTeamCard';

interface BandTeamSettingsProps {
  bandId: string;
}

export const BandTeamSettings: React.FC<BandTeamSettingsProps> = ({
  bandId,
}) => {
  const queryClient = useQueryClient();
  const { data: teams = [], isLoading } = useBandTeams(bandId);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(
    new Set(),
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleToggleSelect = (teamId: string) => {
    setSelectedTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedTeamIds.size === 0 || isDeleting) return;

    const count = selectedTeamIds.size;
    setIsDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedTeamIds).map((teamId) => deleteTeam(teamId)),
      );
      toast.success(`${count}개의 팀이 삭제되었습니다.`);
      setSelectedTeamIds(new Set());
      setIsConfirmOpen(false);
      await queryClient.invalidateQueries({ queryKey: teamKeys.all });
    } catch {
      toast.error('팀 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 text-center typo-sm-r text-grey-300">
        팀 목록을 불러오는 중...
      </div>
    );
  }

  const hasSelected = selectedTeamIds.size > 0;

  return (
    <div className="flex w-full flex-col gap-4 px-5 py-4 text-foreground">
      {/* 1. 상단 액션 바 (총 N개의 팀 + 팀 추가 / 팀 삭제 버튼) */}
      <div className="flex items-center justify-between">
        <h2 className="typo-base-sb text-grey-100">총 {teams.length}개의 팀</h2>

        {hasSelected ? (
          <button
            type="button"
            onClick={() => setIsConfirmOpen(true)}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-[24px] bg-[#fee6e1] px-4 py-2.5 typo-sm-sb text-[#1b1b32] transition-opacity hover:opacity-90 disabled:opacity-50"
            aria-label="팀 삭제"
          >
            {isDeleting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>삭제 중...</span>
              </span>
            ) : (
              <span>팀 삭제</span>
            )}
          </button>
        ) : (
          <Link
            to="/band/$bandId/team/create"
            params={{ bandId }}
            className="inline-flex items-center justify-center rounded-[24px] bg-primary px-4 py-2.5 typo-sm-sb text-grey-600 transition-opacity hover:opacity-90"
          >
            팀 추가
          </Link>
        )}
      </div>

      {/* 2. 팀 목록 아코디언 카드 */}
      {teams.length > 0 ? (
        <div className="flex flex-col gap-3">
          {teams.map((team) => (
            <BandTeamCard
              key={team.teamId}
              bandId={bandId}
              team={team}
              isSelected={selectedTeamIds.has(team.teamId)}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[16px] border border-border bg-surface-3/40 py-12 text-center typo-sm-r text-grey-300">
          아직 생성된 팀이 없습니다.
        </div>
      )}

      {/* 3. 팀 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={
          selectedTeamIds.size > 1
            ? `${selectedTeamIds.size}개의 팀을 삭제하시겠습니까?`
            : '팀을 삭제하시겠습니까?'
        }
        description="삭제된 팀은 복구가 불가능합니다."
        confirmLabel="삭제"
        onConfirm={handleDeleteSelected}
      />
    </div>
  );
};

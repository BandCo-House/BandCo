import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import type {
  BandMemberListItem,
  BandMemberRole,
} from '@/entities/member/model/types';
import type { BandTeamListItem } from '@/entities/team/model/types';
import { MemberSearchModal } from '@/features/schedule-create/ui/components/MemberSearchModal';
import { Checkbox } from '@/shared/ui/checkbox';
import { BandMemberRow } from './BandMemberRow';

interface BandLeaderSectionProps {
  bandId: string;
  leader?: BandMemberListItem;
  subLeaders?: BandMemberListItem[];
  generalMembers: BandMemberListItem[];
  teams: BandTeamListItem[];
  showTeamLeaders: boolean;
  onToggleShowTeamLeaders: (show: boolean) => void;
  onRoleChange: (userId: string, newRole: BandMemberRole) => void;
}

export const BandLeaderSection: React.FC<BandLeaderSectionProps> = ({
  bandId,
  leader,
  subLeaders = [],
  generalMembers,
  teams,
  showTeamLeaders,
  onToggleShowTeamLeaders,
  onRoleChange,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // 팀 리더들에 매칭되는 멤버 목록 계산
  const teamLeaderItems = teams
    .filter((team) => team.teamLeader)
    .map((team) => {
      const matchedMember =
        leader?.userId === team.teamLeader?.userId
          ? leader
          : (subLeaders.find((s) => s.userId === team.teamLeader?.userId) ??
            generalMembers.find((m) => m.userId === team.teamLeader?.userId));

      return {
        team,
        member: matchedMember,
      };
    })
    .filter(
      (item): item is { team: BandTeamListItem; member: BandMemberListItem } =>
        item.member !== undefined,
    );

  const handleSelectSubLeader = (member: BandMemberListItem) => {
    // 밴드 마스터(리더)는 부리더로 중복 지정 방지
    if (member.userId === leader?.userId) return;
    onRoleChange(member.userId, 'ADMIN');
    setIsPickerOpen(false);
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* 헤더 행: "리더 멤버" + [ ] 팀 리더 멤버 보기 */}
      <div className="flex items-center justify-between">
        <h3 className="typo-base-sb text-grey-100">리더 멤버</h3>
        <label className="flex cursor-pointer items-center gap-2 typo-xs-sb text-grey-200">
          <Checkbox
            checked={showTeamLeaders}
            onCheckedChange={(checked) =>
              onToggleShowTeamLeaders(Boolean(checked))
            }
            className="size-4"
          />
          <span>팀 리더 멤버 보기</span>
        </label>
      </div>

      {/* 리더 카드 목록 */}
      <div className="flex flex-col gap-2">
        {/* 1. 밴드 마스터 (리더) */}
        {leader && (
          <BandMemberRow
            member={leader}
            currentRole="BM"
            isLeader={true}
            variant="leader"
          />
        )}

        {/* 2. 밴드 관리자 (부리더 목록) */}
        {subLeaders.map((subLeader) => (
          <BandMemberRow
            key={subLeader.userId}
            member={subLeader}
            currentRole="ADMIN"
            variant="leader"
            onRoleChange={(newRole) => onRoleChange(subLeader.userId, newRole)}
          />
        ))}

        {/* 3. 부리더 추가하기 카드 (상시 표시 & 카드 전체 클릭 가능) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsPickerOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsPickerOpen(true);
            }
          }}
          className="group flex w-full cursor-pointer items-center justify-between rounded-[16px] border border-[#c6c6c8]/40 bg-transparent p-4 shadow-sm backdrop-blur-md transition-all hover:border-[#c6c6c8] hover:bg-white/5"
        >
          <p className="flex-1 text-center typo-xs-sb text-[10px] text-primary">
            새로운 부리더 멤버를 추가해보세요.
          </p>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-[#c6c6c8] px-4 py-2 typo-sm-sb text-grey-400 transition-colors group-hover:bg-white">
            <span>부리더</span>
            <Plus className="size-4" />
          </div>
        </div>

        {/* 4. 팀 리더 목록 (체크박스 활성화 시) */}
        {showTeamLeaders &&
          teamLeaderItems.map(({ team, member }) => (
            <BandMemberRow
              key={`team-leader-${team.teamId}-${member.userId}`}
              member={member}
              currentRole={member.role as BandMemberRole}
              teamName={team.name}
              variant="leader"
            />
          ))}
      </div>

      {/* 부리더 검색/선택 모달 (MemberSearchModal 재사용) */}
      {isPickerOpen && (
        <MemberSearchModal
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          bandId={bandId}
          selectedIds={subLeaders.map((s) => s.bandMemberId)}
          onToggleMember={handleSelectSubLeader}
        />
      )}
    </div>
  );
};

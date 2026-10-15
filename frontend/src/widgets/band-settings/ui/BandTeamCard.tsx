import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronRight, ChevronUp } from 'lucide-react';
import { useTeamMembers } from '@/entities/team/api/queries';
import type { BandTeamListItem, TeamMember } from '@/entities/team/model/types';
import { ProfileChip } from '@/entities/user';
import { cardSurfaceClass } from '@/shared/ui/card-surface';
import { Checkbox } from '@/shared/ui/checkbox';
import { cn } from '@/shared/lib/utils';

interface BandTeamCardProps {
  bandId: string;
  team: BandTeamListItem;
  isSelected: boolean;
  onToggleSelect: (teamId: string) => void;
}

export const BandTeamCard: React.FC<BandTeamCardProps> = ({
  bandId,
  team,
  isSelected,
  onToggleSelect,
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: members = [] } = useTeamMembers(team.teamId);

  const getSessionName = (member: TeamMember, idx: number) => {
    if (member.skills && member.skills.length > 0) {
      return member.skills.map((s) => s.skillName).join(', ');
    }
    return member.sessionName || `세션${idx + 1}`;
  };

  const handleCardClick = () => {
    navigate({
      to: '/band/$bandId/team/$teamId',
      params: { bandId, teamId: team.teamId },
      search: { mode: 'read' },
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={cn(
        cardSurfaceClass,
        'group/card flex w-full glass-pressable cursor-pointer flex-col gap-3',
      )}
    >
      {/* 1. 상단 행: 체크박스 + 팀명 + 상세 링크 아이콘 */}
      <div className="flex items-center gap-2">
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="flex items-center"
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(team.teamId)}
            aria-label={`${team.name} 선택`}
            className="size-5"
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-between">
          <span className="truncate typo-base-sb text-grey-50">
            {team.name}
          </span>
          <ChevronRight className="h-5 w-5 text-grey-300 transition-transform group-hover/card:translate-x-0.5 group-hover/card:text-white" />
        </div>
      </div>

      {/* 2. 세션 요약 (예: 기타: 김민준  베이스: 김루나 …).
          한 줄로 묶고 넘치면 말줄임한다. 줄바꿈을 허용하면 팀원이 많을수록 요약이 서너 줄로
          늘어나, 아래 펼쳐 보는 팀원 목록보다 요약이 더 길어진다. 전체는 펼치면 보인다. */}
      {members.length > 0 && (
        <p className="truncate typo-xs-r text-grey-200">
          {members.map((member, idx) => (
            <span key={member.teamMemberId} className="mr-3 last:mr-0">
              {getSessionName(member, idx)}: {member.user.nickname}
            </span>
          ))}
        </p>
      )}

      {/* 3. 아코디언 펼침: 팀원 상세 아바타 + 이름 칩 목록.
          높이를 모르는 내용을 접으려고 grid 행을 0fr↔1fr로 바꾼다 — height는 auto로 전환이 안 된다.
          접혀 있어도 DOM에 남으므로 스크린리더에는 숨긴다(안에 누를 수 있는 건 없다). */}
      {members.length > 0 && (
        <div
          aria-hidden={!isExpanded}
          className={cn(
            // 카드의 gap(12px)을 안쪽 pt로 옮긴다. 그대로 두면 접힌 뒤에도 빈 행의 gap이 남는다.
            '-mt-3 grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
            isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="flex flex-wrap items-start gap-x-2.5 gap-y-2 pt-3">
              {members.map((member) => (
                <ProfileChip
                  key={member.teamMemberId}
                  nickname={member.user.nickname}
                  avatarUrl={member.user.profileImageUrl}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. 아코디언 토글 버튼 (이벤트 전파 차단) */}
      {members.length > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          // 아이콘(16px)만으로는 누르기 어렵다. 위아래로 영역을 넓히되, 음수 마진으로 카드 아래 여백은 그대로 둔다.
          className="-mt-2 -mb-3 flex w-full items-center justify-center py-3 text-grey-300 transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          aria-expanded={isExpanded}
          aria-label={
            isExpanded ? `${team.name} 팀원 접기` : `${team.name} 팀원 펼치기`
          }
        >
          <ChevronUp
            aria-hidden="true"
            className={cn(
              'size-4 transition-transform duration-200 motion-reduce:transition-none',
              !isExpanded && 'rotate-180',
            )}
          />
        </button>
      )}
    </div>
  );
};

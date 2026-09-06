import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import { useTeamMembers } from '@/entities/team/api/queries';
import type { BandTeamListItem, TeamMember } from '@/entities/team/model/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Checkbox } from '@/shared/ui/checkbox';

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
      className="group/card flex w-full cursor-pointer flex-col gap-2 rounded-[16px] border border-[#c6c6c8]/30 bg-[rgba(101,99,122,0.48)] p-4 shadow-sm backdrop-blur-md transition-all hover:border-[#c6c6c8]/60 hover:bg-[rgba(101,99,122,0.6)]"
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

        <div className="flex flex-1 items-center justify-between min-w-0">
          <span className="truncate typo-sm-b text-grey-50 font-bold">
            {team.name}
          </span>
          <ChevronRight className="h-5 w-5 text-grey-300 transition-transform group-hover/card:translate-x-0.5 group-hover/card:text-white" />
        </div>
      </div>

      {/* 2. 세션 요약 텍스트 (예: 기타: 김민준  베이스: 김루나 ...) */}
      {members.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-1.5 typo-xs-sb text-grey-200">
          {members.map((member, idx) => (
            <span key={member.teamMemberId} className="whitespace-nowrap">
              {getSessionName(member, idx)}: {member.user.nickname}
            </span>
          ))}
        </div>
      )}

      {/* 3. 아코디언 펼침: 팀원 상세 아바타 + 이름 칩 목록 */}
      {isExpanded && members.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {members.map((member) => (
            <div
              key={member.teamMemberId}
              className="inline-flex items-center gap-2 rounded-full bg-[rgba(97,117,158,0.56)] px-2.5 py-1"
            >
              <Avatar className="h-8 w-8 rounded-full shrink-0">
                <AvatarImage
                  src={member.user.profileImageUrl || undefined}
                  alt={member.user.nickname}
                />
                <AvatarFallback className="text-xs">
                  {member.user.nickname.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="typo-sm-m text-grey-50 text-xs">
                {member.user.nickname}
              </span>
            </div>
          ))}
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
          className="flex w-full items-center justify-center pt-1 text-grey-300 hover:text-white transition-colors"
          aria-label={isExpanded ? `${team.name} 팀원 접기` : `${team.name} 팀원 펼치기`}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
};


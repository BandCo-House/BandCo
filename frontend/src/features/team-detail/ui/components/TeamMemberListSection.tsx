import React from 'react';
import { Pencil, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import type { TeamMember } from '@/entities/team/model/types';

interface TeamMemberListSectionProps {
  members: TeamMember[];
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onOpenSearchForSession: (index: number) => void;
  onOpenSearchForNewMember: () => void;
}

export const TeamMemberListSection: React.FC<TeamMemberListSectionProps> = ({
  members,
  isEditing = false,
  onToggleEdit,
  onOpenSearchForSession,
  onOpenSearchForNewMember,
}) => {
  const getSessionName = (member: TeamMember, defaultIndex?: number) => {
    if (member.skills && member.skills.length > 0) {
      return member.skills.map((s) => s.skillName).join(', ');
    }
    if (member.sessionName) return member.sessionName;
    return defaultIndex !== undefined ? `세션${defaultIndex + 1}` : '세션';
  };
  return (
    <div className="rounded-[20px] border border-[#28272a] bg-[#65637a]/48 p-5 shadow-sm backdrop-blur-md w-full">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="typo-base-b text-grey-50 font-bold">팀원 목록</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={onToggleEdit}
            aria-label="팀원 수정"
            className="flex items-center gap-2 px-3 py-2 rounded-full text-grey-300 hover:text-white transition-colors"
          >
            <span className="typo-sm-m text-sm">수정</span>
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isEditing ? (
        /* 읽기 모드: 피그마 알약 캡슐(Pill) 스타일 (text-[#ECFCAB] 라임 세션명 + 32px 아바타 + white 닉네임) */
        <div className="flex flex-wrap gap-1.5 items-start pt-1">
          {members.map((member) => (
            <div
              key={member.teamMemberId}
              className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(97,117,158,0.56)] px-3 py-1 shadow-xs"
            >
              <span className="typo-base-sb text-[#ECFCAB] font-semibold text-base">
                {getSessionName(member)}:
              </span>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 rounded-full shrink-0">
                  <AvatarImage
                    src={member.user.profileImageUrl || undefined}
                    alt={member.user.nickname}
                  />
                  <AvatarFallback className="text-xs">
                    {member.user.nickname.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="typo-sm-m text-grey-50 text-sm">
                  {member.user.nickname}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 피그마 팀원 수정 모드: (라임 #ECFCAB 밑줄 Input + 40px 원형 🔍 돋보기 버튼) */
        <div className="flex flex-col gap-4 pt-1 w-full">
          {members.map((member, idx) => (
            <div
              key={member.teamMemberId}
              className="flex items-center gap-2 py-0.5 w-full"
            >
              {/* 좌측 세션명 + 라임 #ECFCAB 밑줄 */}
              <div className="flex-1 border-b border-[#ECFCAB] h-[54px] flex items-center px-3 py-4">
                <span className="typo-base-sb text-grey-50 font-semibold text-base">
                  {getSessionName(member, idx)}
                </span>
              </div>

              {/* 멤버 칩 */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(97,117,158,0.56)] px-3 py-1.5 shrink-0">
                <Avatar className="h-8 w-8 rounded-full shrink-0">
                  <AvatarImage
                    src={member.user.profileImageUrl || undefined}
                    alt={member.user.nickname}
                  />
                  <AvatarFallback className="text-xs">
                    {member.user.nickname.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="typo-sm-m text-grey-50 text-sm">
                  {member.user.nickname}
                </span>
              </div>

              {/* 라임 🔍 돋보기 40px 원형 버튼 */}
              <button
                type="button"
                onClick={() => onOpenSearchForSession(idx)}
                className="flex items-center justify-center rounded-full bg-[rgba(97,117,158,0.56)] shrink-0 h-10 w-10 text-[#ECFCAB] hover:bg-[#61759E]/80 transition-colors"
                aria-label={`${getSessionName(member, idx)} 멤버 변경`}
              >
                <Search className="h-6 w-6" />
              </button>
            </div>
          ))}

          {/* 미할당 세션 추가 라인 */}
          <div className="flex items-center gap-2 py-0.5 w-full">
            <div className="flex-1 border-b border-[#3D3E54] h-[54px] flex items-center px-3 py-4">
              <span className="typo-base-r text-grey-400 text-base">
                {`세션${members.length + 1}`}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSearchForNewMember}
              className="flex items-center justify-center rounded-full bg-[rgba(97,117,158,0.56)] shrink-0 h-10 w-10 text-[#ECFCAB] hover:bg-[#61759E]/80 transition-colors"
              aria-label="세션 멤버 검색"
            >
              <Search className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

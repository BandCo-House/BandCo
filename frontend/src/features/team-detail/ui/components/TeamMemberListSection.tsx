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
    <div className="w-full rounded-[20px] border border-[#28272a] bg-[#65637a]/48 p-5 shadow-sm backdrop-blur-md">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="typo-base-b text-grey-50">팀원 목록</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={onToggleEdit}
            aria-label="팀원 수정"
            className="flex items-center gap-2 rounded-full px-3 py-2 text-grey-300 transition-colors hover:text-white"
          >
            <span className="typo-sm-sb">수정</span>
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isEditing ? (
        /* 읽기 모드: 피그마 알약 캡슐(Pill) 스타일 (text-primary 라임 세션명 + 32px 아바타 + white 닉네임) */
        <div className="flex flex-wrap items-start gap-1.5 pt-1">
          {members.map((member) => (
            <div
              key={member.teamMemberId}
              className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(97,117,158,0.56)] px-3 py-1 shadow-xs"
            >
              <span className="typo-base-sb text-primary">
                {getSessionName(member)}:
              </span>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 shrink-0 rounded-full">
                  <AvatarImage
                    src={member.user.profileImageUrl || undefined}
                    alt={member.user.nickname}
                  />
                  <AvatarFallback className="typo-xs-sb">
                    {member.user.nickname.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="typo-sm-sb text-grey-50">
                  {member.user.nickname}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* 피그마 팀원 수정 모드: (라임 #ECFCAB 밑줄 Input + 40px 원형 🔍 돋보기 버튼) */
        <div className="flex w-full flex-col gap-4 pt-1">
          {members.map((member, idx) => (
            <div
              key={member.teamMemberId}
              className="flex w-full items-center gap-2 py-0.5"
            >
              {/* 좌측 세션명 + 라임 #ECFCAB 밑줄 */}
              <div className="flex h-[54px] flex-1 items-center border-b border-[#ECFCAB] px-3 py-4">
                <span className="typo-base-sb text-grey-50">
                  {getSessionName(member, idx)}
                </span>
              </div>

              {/* 멤버 칩 */}
              <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[rgba(97,117,158,0.56)] px-3 py-1.5">
                <Avatar className="h-8 w-8 shrink-0 rounded-full">
                  <AvatarImage
                    src={member.user.profileImageUrl || undefined}
                    alt={member.user.nickname}
                  />
                  <AvatarFallback className="typo-xs-sb">
                    {member.user.nickname.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="typo-sm-sb text-grey-50">
                  {member.user.nickname}
                </span>
              </div>

              {/* 라임 🔍 돋보기 40px 원형 버튼 */}
              <button
                type="button"
                onClick={() => onOpenSearchForSession(idx)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(97,117,158,0.56)] text-primary transition-colors hover:bg-[#61759E]/80"
                aria-label={`${getSessionName(member, idx)} 멤버 변경`}
              >
                <Search className="h-6 w-6" />
              </button>
            </div>
          ))}

          {/* 미할당 세션 추가 라인 */}
          <div className="flex w-full items-center gap-2 py-0.5">
            <div className="flex h-[54px] flex-1 items-center border-b border-[#3D3E54] px-3 py-4">
              <span className="typo-base-r text-grey-400">
                {`세션${members.length + 1}`}
              </span>
            </div>
            <button
              type="button"
              onClick={onOpenSearchForNewMember}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(97,117,158,0.56)] text-primary transition-colors hover:bg-[#61759E]/80"
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

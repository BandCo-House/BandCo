import React from 'react';
import { Pencil, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { ProfileChip } from '@/entities/user';
import { cardSurfaceClass } from '@/shared/ui/card-surface';
import { cn } from '@/shared/lib/utils';
import { useSkillTypes } from '@/entities/skill/api/useSkillTypes';
import { SelectField } from '@/shared/ui/select-field';
import type { TeamMember } from '@/entities/team/model/types';

interface TeamMemberListSectionProps {
  members: TeamMember[];
  isEditing?: boolean;
  onToggleEdit?: () => void;
  onOpenSearchForSession: (index: number) => void;
  onOpenSearchForNewMember: () => void;
  /** 팀에서 맡을 세션을 바꾼다. 수정 모드에서만 쓰인다. */
  onChangeSession?: (
    index: number,
    skillType: { skillTypeId: string; name: string } | null,
  ) => void;
}

export const TeamMemberListSection: React.FC<TeamMemberListSectionProps> = ({
  members,
  isEditing = false,
  onToggleEdit,
  onOpenSearchForSession,
  onOpenSearchForNewMember,
  onChangeSession,
}) => {
  // 실패를 []로 뭉개면 "세션이 하나도 없는 팀"처럼 보여서, 사용자는 왜 못 고르는지
  // 알 수 없다. 로딩 중에는 잠그고 실패는 인라인으로 알린다.
  const {
    data: skillTypes = [],
    isLoading: isSkillTypesLoading,
    isError: isSkillTypesError,
  } = useSkillTypes(isEditing);

  /**
   * 팀에서 맡은 세션. `skillType`이 실제 편성이고, 없을 때만 보유 스킬로 대신 채운다.
   * 둘은 다른 값이라 — 편성이 정해지면 그걸 우선한다.
   */
  const getSessionName = (member: TeamMember, defaultIndex?: number) => {
    if (member.skillType) return member.skillType.name;
    if (member.skills && member.skills.length > 0) {
      return member.skills.map((s) => s.skillName).join(', ');
    }
    if (member.sessionName) return member.sessionName;
    return defaultIndex !== undefined ? `세션${defaultIndex + 1}` : '세션';
  };
  return (
    <div className={cn(cardSurfaceClass, 'flex w-full flex-col gap-3')}>
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="typo-base-b text-grey-50">팀원 목록</h3>
        {!isEditing && (
          <button
            type="button"
            onClick={onToggleEdit}
            aria-label="팀원 수정"
            // 누르는 영역(px-3 py-2)은 유지하되 음수 마진으로 줄 높이에서 뺀다. 그대로 두면 버튼이
            // 제목보다 커서 헤더가 늘어나고, 카드 위쪽 여백만 두꺼워 보인다.
            className="-my-2 -mr-3 flex items-center gap-2 rounded-full px-3 py-2 text-grey-300 transition-colors hover:text-white"
          >
            <span className="typo-sm-sb">수정</span>
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isEditing ? (
        /* 읽기 모드: 피그마 알약 캡슐(Pill) 스타일 (text-primary 라임 세션명 + 32px 아바타 + white 닉네임) */
        <div className="flex flex-wrap items-start gap-x-2.5 gap-y-2">
          {members.map((member) => (
            <ProfileChip
              key={member.teamMemberId}
              variant="assigned"
              sessionName={getSessionName(member)}
              nickname={member.user.nickname}
              avatarUrl={member.user.profileImageUrl}
            />
          ))}
        </div>
      ) : (
        /* 피그마 팀원 수정 모드: (라임 #ECFCAB 밑줄 Input + 40px 원형 🔍 돋보기 버튼) */
        <div className="flex w-full flex-col gap-4">
          {/* placeholder 문구만으로는 스크린리더에 변화가 전달되지 않는다. */}
          {isSkillTypesError && (
            <p role="alert" className="typo-sm-r text-destructive">
              세션 목록을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          )}
          {members.map((member, idx) => (
            <div
              key={member.teamMemberId}
              className="flex w-full items-center gap-2 py-0.5"
            >
              {/* 좌측 세션 선택 — 팀에서 맡을 자리를 직접 고른다 */}
              <div className="flex-1">
                <SelectField
                  value={member.skillType?.skillTypeId ?? null}
                  onValueChange={(skillTypeId) => {
                    const picked = skillTypes.find((s) => s.id === skillTypeId);
                    if (picked) {
                      onChangeSession?.(idx, {
                        skillTypeId: picked.id,
                        name: picked.name,
                      });
                    }
                  }}
                  options={skillTypes.map((skill) => ({
                    value: skill.id,
                    label: skill.name,
                  }))}
                  placeholder={
                    isSkillTypesLoading
                      ? '세션 불러오는 중…'
                      : isSkillTypesError
                        ? '세션을 불러오지 못했어요'
                        : `세션${idx + 1}`
                  }
                  disabled={isSkillTypesLoading || isSkillTypesError}
                  ariaLabel={`${member.user.nickname} 세션 선택`}
                />
              </div>

              {/* 멤버 칩 */}
              <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-surface-2 glass-surface px-3 py-1.5">
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 glass-surface text-primary transition-colors hover:bg-[#61759E]/80"
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 glass-surface text-primary transition-colors hover:bg-[#61759E]/80"
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

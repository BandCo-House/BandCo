import React from 'react';
import { cn } from '@/shared/lib/utils';
import { cardSurfaceClass } from '@/shared/ui/card-surface';
import type {
  BandMemberListItem,
  BandMemberRole,
} from '@/entities/member/model/types';
import { calcSkillNames } from '@/entities/skill';
import { ProfileChip } from '@/entities/user';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

// 세션을 전부 늘어놓으면 닉네임 자리를 밀어낸다. 대표 세션부터 이만큼만 보여준다.
const MAX_SESSIONS = 3;

interface BandMemberRowProps {
  member: BandMemberListItem;
  currentRole: BandMemberRole;
  isLeader?: boolean;
  variant?: 'leader' | 'general';
  teamName?: string;
  onRoleChange?: (newRole: BandMemberRole) => void;
  onKick?: (member: BandMemberListItem) => void;
}

export const BandMemberRow: React.FC<BandMemberRowProps> = ({
  member,
  currentRole,
  isLeader = false,
  variant = 'general',
  teamName,
  onRoleChange,
  onKick,
}) => {
  const isLeaderStyle = isLeader || variant === 'leader';
  const sessionNames = calcSkillNames(member.skills, MAX_SESSIONS);
  const hiddenSessionCount = member.skills.length - sessionNames.length;
  // 잘린 세션이 있으면 몇 개가 더 있는지 붙인다 — 없으면 3개가 전부인 줄 안다.
  const sessionSummary = [
    sessionNames.join(' · '),
    hiddenSessionCount > 0 && `+${hiddenSessionCount}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cn(
        cardSurfaceClass,
        'flex w-full items-center gap-2 shadow-sm backdrop-blur-md',
        isLeaderStyle && 'bg-surface-1',
      )}
    >
      <ProfileChip
        variant="full"
        nickname={member.nickname}
        avatarUrl={member.avatarUrl}
        sessionName={sessionSummary}
      />

      {/* 2. 우측: 역할 뱃지 / 드롭다운 & 강퇴 버튼 */}
      <div className="flex shrink-0 items-center gap-2">
        {isLeader ? (
          <div className="flex items-center justify-center rounded-full bg-primary px-4 py-1.5 typo-sm-b text-grey-600">
            리더
          </div>
        ) : teamName ? (
          <div className="flex items-center justify-center rounded-full bg-grey-400 px-3 py-1.5 typo-xs-sb text-white">
            팀 리더 ({teamName})
          </div>
        ) : (
          <>
            <Select
              value={currentRole}
              onValueChange={(val) => onRoleChange?.(val as BandMemberRole)}
            >
              <SelectTrigger className="h-auto w-auto gap-1.5 rounded-full border-0 bg-grey-400 px-3.5 py-1.5 typo-sm-sb text-grey-50 hover:bg-grey-400/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">멤버</SelectItem>
                <SelectItem value="ADMIN">부리더</SelectItem>
              </SelectContent>
            </Select>

            {currentRole !== 'ADMIN' && onKick && (
              <button
                type="button"
                onClick={() => onKick(member)}
                className="px-2.5 py-1 typo-xs-sb text-destructive transition-opacity hover:opacity-80"
              >
                강퇴
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

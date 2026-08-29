import React from 'react';
import type {
  BandMemberListItem,
  BandMemberRole,
} from '@/entities/member/model/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';

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

  return (
    <div
      className={
        isLeaderStyle
          ? 'flex w-full items-center justify-between rounded-[16px] border border-[#c6c6c8] bg-[rgba(220,226,249,0.4)] p-4 shadow-sm backdrop-blur-md'
          : 'flex w-full items-center justify-between rounded-[16px] border border-[#646468] bg-[rgba(101,99,122,0.48)] p-4 shadow-sm backdrop-blur-md'
      }
    >
      {/* 1. 좌측: 아바타 + 닉네임 + 스킬 파트 */}
      <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
        <div className="flex shrink-0 items-center gap-2">
          <Avatar className="h-8 w-8 rounded-full">
            <AvatarImage
              src={member.avatarUrl || undefined}
              alt={member.nickname}
            />
            <AvatarFallback className="text-xs">
              {member.nickname.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate typo-sm-m text-xs font-medium text-white">
            {member.nickname}
          </span>
        </div>

        {member.skills && member.skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-1.5 typo-xs-m text-[10px] text-grey-200">
            {member.skills.map((skill) => (
              <span key={skill.skillTypeId} className="whitespace-nowrap">
                {skill.skillName}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. 우측: 역할 뱃지 / 드롭다운 & 강퇴 버튼 */}
      <div className="flex shrink-0 items-center gap-2">
        {isLeader ? (
          <div className="flex items-center justify-center rounded-full bg-primary px-4 py-1.5 typo-sm-b text-xs font-bold text-gray-900">
            리더
          </div>
        ) : teamName ? (
          <div className="flex items-center justify-center rounded-full bg-grey-400 px-3 py-1.5 typo-xs-sb text-xs text-white">
            팀 리더 ({teamName})
          </div>
        ) : (
          <>
            <Select
              value={currentRole}
              onValueChange={(val) => onRoleChange?.(val as BandMemberRole)}
            >
              <SelectTrigger className="h-auto w-auto gap-1.5 rounded-full border-0 bg-[#646468] px-3.5 py-1.5 typo-sm-m text-xs text-white hover:bg-[#727277]">
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
                className="px-2.5 py-1 typo-xs-m text-[#d6705c] transition-opacity hover:opacity-80"
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

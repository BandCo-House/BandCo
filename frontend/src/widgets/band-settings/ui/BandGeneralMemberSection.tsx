import React from 'react';
import type {
  BandMemberListItem,
  BandMemberRole,
} from '@/entities/member/model/types';
import { BandMemberRow } from './BandMemberRow';

interface BandGeneralMemberSectionProps {
  members: BandMemberListItem[];
  onRoleChange: (userId: string, newRole: BandMemberRole) => void;
  onKick: (member: BandMemberListItem) => void;
}

export const BandGeneralMemberSection: React.FC<
  BandGeneralMemberSectionProps
> = ({ members, onRoleChange, onKick }) => {
  return (
    <div className="flex flex-col gap-2.5">
      <h3 className="typo-base-sb text-grey-100">일반 멤버</h3>

      <div className="flex flex-col gap-2">
        {members.length > 0 ? (
          members.map((member) => (
            <BandMemberRow
              key={member.userId}
              member={member}
              currentRole="MEMBER"
              onRoleChange={(newRole) => onRoleChange(member.userId, newRole)}
              onKick={onKick}
            />
          ))
        ) : (
          <div className="rounded-[16px] border border-border bg-surface-3/30 py-8 text-center typo-sm-r text-grey-300">
            일반 멤버가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

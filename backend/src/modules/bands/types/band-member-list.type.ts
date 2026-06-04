import type { BandMemberRole, SkillLevelType } from '../../../generated/prisma';

export interface BandMemberSkillItem {
  skillTypeId: string;
  skillName: string;
  skillLevel: SkillLevelType;
  isPrimary: boolean;
}

export interface BandMemberListItem {
  bandMemberId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  role: BandMemberRole;
  joinedAt: string;
  skills: BandMemberSkillItem[];
}

export interface BandMemberListCursor {
  joinedAt: string;
  id: string;
}

export interface GetBandMembersResult {
  bandId: string;
  members: BandMemberListItem[];
  meta: {
    count: number;
    take: number;
    cursor: BandMemberListCursor | null;
    next: BandMemberListCursor | null;
  };
}

import type { BandMemberRole } from '../../../generated/prisma';

export interface BandInviteLinkAccessContext {
  id: string;
  member: {
    id: string;
    role: BandMemberRole;
  } | null;
}

export interface BandInviteLinkJoinContext {
  bandId: string;
  expiredAt: Date | null;
}

export interface UpsertBandInviteLinkInput {
  bandId: string;
  createBandMemberId: string;
  codeHash: string;
  expiredAt: Date;
}

export interface BandInviteLinkItem {
  bandId: string;
  expiredAt: Date;
}

export interface JoinedBandMember {
  id: string;
  joinedAt: Date;
}

export interface CreateBandInviteLinkResult {
  bandId: string;
  inviteCode: string;
  expiredAt: string;
}

export interface RevokeBandInviteLinkResult {
  bandId: string;
  revokedAt: string;
}

export interface JoinBandByInviteLinkResult {
  bandId: string;
  userId: string;
  memberId: string;
  joinedAt: string;
}

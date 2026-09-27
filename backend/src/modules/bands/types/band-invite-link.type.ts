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

/** 초대 링크 존재 여부 조회 결과. 원본 코드는 해시로만 저장돼 다시 돌려줄 수 없으므로 만료 시각만 알려준다. */
export interface GetBandInviteLinkResult {
  bandId: string;
  /** 발급돼 있고 아직 만료되지 않은 링크가 있으면 true */
  hasActiveLink: boolean;
  /** 활성 링크의 만료 시각(ISO). 링크가 없거나 만료됐으면 null */
  expiredAt: string | null;
}

export interface JoinBandByInviteLinkResult {
  bandId: string;
  userId: string;
  memberId: string;
  joinedAt: string;
}

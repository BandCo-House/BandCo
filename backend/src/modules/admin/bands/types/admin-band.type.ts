import type { BandMemberRole, BandSpaceStatus, BandSpaceType } from 'src/generated/prisma';

/** 어드민 화면에서 유저를 가리킬 때 쓰는 최소 정보 */
export type AdminBandUserSummary = {
  userId: string;
  nickname: string | null;
  email: string | null;
};

/** 밴드 목록 필터. keyword가 UUID면 밴드 ID 일치도 함께 찾는다. */
export type AdminBandListFilter = {
  keyword?: string;
  includeDeleted: boolean;
};

export type AdminBandListItem = {
  bandId: string;
  name: string;
  visibility: boolean;
  coverImgUrl: string | null;
  bandMaster: AdminBandUserSummary;
  memberCount: number;
  createdAt: string;
  deletedAt: string | null;
};

export type AdminBandDetail = {
  bandId: string;
  name: string;
  description: string | null;
  visibility: boolean;
  coverImgUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  genres: { genreId: string; name: string }[];
  bandMaster: AdminBandUserSummary;
  members: {
    bandMemberId: string;
    userId: string;
    nickname: string | null;
    email: string | null;
    role: BandMemberRole;
    joinedAt: string;
  }[];
  bandSpaces: {
    bandSpaceId: string;
    name: string;
    spaceType: BandSpaceType | null;
    status: BandSpaceStatus;
    memberCount: number;
    createdAt: string;
    deletedAt: string | null;
  }[];
  pendingJoinRequests: { requestId: string; userId: string; nickname: string | null; createdAt: string }[];
  pendingInvitations: { invitationId: string; inviteeUserId: string; inviteeNickname: string | null; createdAt: string }[];
  inviteLink: { hasActiveLink: boolean; expiredAt: string | null };
  counts: { songs: number; schedules: number; teams: number; places: number };
};

/**
 * Repository가 돌려주는 밴드 상세 원본.
 * 초대 링크 활성 여부는 현재 시각과 비교하는 판단이라 Service가 만들도록 만료 시각만 넘긴다.
 */
export type AdminBandDetailRecord = Omit<AdminBandDetail, 'inviteLink'> & {
  inviteLinkExpiredAt: Date | null;
};

/** 쓰기 작업 전 존재·삭제 여부와 현재 밴드장을 확인하는 데 쓰는 상태 */
export type AdminBandState = {
  id: string;
  bandMasterUserId: string;
  deletedAt: Date | null;
};

export type AdminBandMembership = {
  id: string;
  userId: string;
  role: BandMemberRole;
  /** 멤버십은 남아 있어도 회원이 탈퇴했을 수 있다 */
  isUserDeleted: boolean;
};

export type TransferBandMasterResult = {
  bandId: string;
  bandMasterUserId: string;
  previousBandMasterUserId: string;
};

export type ExpireBandInviteLinkResult = {
  bandId: string;
  expiredAt: string;
};

export type DeleteBandResult = {
  bandId: string;
  deletedAt: string;
};

export type RestoreBandResult = {
  bandId: string;
  deletedAt: null;
};

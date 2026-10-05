import type { BandMemberRole } from '@/features/users/types';
import type { PageQuery } from '@/shared/api/types';

export interface BandMasterSummary {
  userId: string;
  nickname: string | null;
  email: string | null;
}

export interface AdminBandListItem {
  bandId: string;
  name: string;
  /** true면 공개 밴드 */
  visibility: boolean;
  coverImgUrl: string | null;
  bandMaster: BandMasterSummary;
  memberCount: number;
  createdAt: string;
  deletedAt: string | null;
}

export type BandSpaceType = 'PERFORMANCE' | 'PRACTICE' | 'ONLINE';

export type BandSpaceStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminBandMember {
  bandMemberId: string;
  userId: string;
  nickname: string | null;
  email: string | null;
  role: BandMemberRole;
  joinedAt: string;
}

export interface AdminBandSpace {
  bandSpaceId: string;
  name: string;
  spaceType: BandSpaceType | null;
  status: BandSpaceStatus;
  memberCount: number;
  createdAt: string;
  deletedAt: string | null;
}

export interface AdminBandJoinRequest {
  requestId: string;
  userId: string;
  nickname: string | null;
  createdAt: string;
}

export interface AdminBandInvitation {
  invitationId: string;
  inviteeUserId: string;
  inviteeNickname: string | null;
  createdAt: string;
}

export interface AdminBandDetail {
  bandId: string;
  name: string;
  description: string | null;
  visibility: boolean;
  coverImgUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  genres: Array<{ genreId: string; name: string }>;
  bandMaster: BandMasterSummary;
  members: AdminBandMember[];
  bandSpaces: AdminBandSpace[];
  pendingJoinRequests: AdminBandJoinRequest[];
  pendingInvitations: AdminBandInvitation[];
  inviteLink: { hasActiveLink: boolean; expiredAt: string | null };
  counts: { songs: number; schedules: number; teams: number; places: number };
}

export interface BandListQuery extends PageQuery {
  keyword?: string;
  includeDeleted?: boolean;
}

export interface TransferBandMasterRequest {
  userId: string;
}

export interface TransferBandMasterResult {
  bandId: string;
  bandMasterUserId: string;
  previousBandMasterUserId: string;
}

export interface ExpireInviteLinkResult {
  bandId: string;
  expiredAt: string;
}

export interface DeleteBandResult {
  bandId: string;
  deletedAt: string;
}

export interface RestoreBandResult {
  bandId: string;
  deletedAt: null;
}

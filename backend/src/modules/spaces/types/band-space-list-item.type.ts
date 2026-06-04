import type { BandSpaceMemberRole, BandSpaceStatus, BandSpaceType } from '../../../generated/prisma';

export type SpaceType = BandSpaceType;

export type SpaceStatus = BandSpaceStatus;

export type SpaceMemberRole = BandSpaceMemberRole;

export interface BandSpaceMembership {
  isMember: boolean;
  role: SpaceMemberRole;
}

export interface BandSpaceListItem {
  spaceId: string;
  bandId: string;
  createdByBandMemberId: string;
  name: string;
  description: string;
  spaceType: SpaceType;
  status: SpaceStatus;
  startDate: string;
  endDate: string;
  memberCount: number;
  songCount: number;
  isMine: boolean;
  myMembership: BandSpaceMembership;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  size: number;
  totalCount: number;
  hasNext: boolean;
}

export interface GetBandSpacesResult {
  items: BandSpaceListItem[];
  pagination: Pagination;
}

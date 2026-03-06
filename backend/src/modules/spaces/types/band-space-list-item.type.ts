export type SpaceType = 'PRACTICE_ROOM' | 'STUDIO' | 'ONLINE' | 'ETC';

export type SpaceStatus = 'ACTIVE' | 'INACTIVE';

export type SpaceMemberRole = 'LEADER' | 'MEMBER';

export interface BandSpaceMembership {
  isMember: boolean;
  role: SpaceMemberRole;
}

export interface BandSpaceListItem {
  spaceId: string;
  bandId: string;
  createdByUserId: string;
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

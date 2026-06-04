import type { BandSpaceMembership, SpaceStatus, SpaceType } from './band-space-list-item.type';

export interface SpaceDetail {
  spaceId: string;
  bandId: string;
  name: string;
  description: string;
  spaceType: SpaceType;
  status: SpaceStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpaceMemberDetail {
  bandMemberId: string;
  nickname: string;
  role: BandSpaceMembership['role'];
  status: 'ACTIVE' | 'INACTIVE';
  joinedAt: string;
}

export interface GetSpaceDetailResult {
  space: SpaceDetail;
  members: SpaceMemberDetail[];
  songCount: number;
  scheduleCount: number;
}

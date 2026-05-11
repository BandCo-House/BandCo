import type { SpaceStatus, SpaceType } from './band-space-list-item.type';

export interface CreateBandSpaceResult {
  spaceId: string;
  bandId: string;
  name: string;
  description: string;
  spaceType: SpaceType;
  status: SpaceStatus;
  startDate: string;
  endDate: string;
  createdByBandMemberId: string;
  createdAt: string;
}

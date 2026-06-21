import type { BandSpaceStatus, BandSpaceType } from '../../../generated/prisma';

export interface UpdateBandSpaceResult {
  spaceId: string;
  bandId: string;
  name: string;
  description: string;
  spaceType: BandSpaceType;
  status: BandSpaceStatus;
  startDate: string;
  endDate: string;
  updatedAt: string;
}

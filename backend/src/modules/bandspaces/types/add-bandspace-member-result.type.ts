import type { BandSpaceMemberRole, BandSpaceMemberStatus } from '../../../generated/prisma';

export interface AddBandSpaceMemberResult {
  memberId: string;
  spaceId: string;
  bandMemberId: string;
  role: BandSpaceMemberRole;
  status: BandSpaceMemberStatus;
  joinedAt: string;
}

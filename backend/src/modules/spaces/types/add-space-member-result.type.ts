import type { BandSpaceMemberRole, BandSpaceMemberStatus } from '../../../generated/prisma';

export interface AddSpaceMemberResult {
  memberId: string;
  spaceId: string;
  userId: string;
  bandMemberId: string;
  role: BandSpaceMemberRole;
  status: BandSpaceMemberStatus;
  joinedAt: string;
}

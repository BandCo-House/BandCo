import type { BandSpaceMemberRole } from '../../../generated/prisma';

export interface UpdateBandSpaceMemberRoleResult {
  memberId: string;
  spaceId: string;
  userId: string;
  bandMemberId: string;
  role: BandSpaceMemberRole;
  updatedAt: string;
}

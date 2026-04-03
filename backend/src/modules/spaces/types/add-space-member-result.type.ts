import type { BandSpaceMemberRole, BandSpaceMemberStatus } from '../../../generated/prisma';

export interface AddSpaceMemberResult {
  memberId: string;
  spaceId: string;
  userId: string;
  role: BandSpaceMemberRole;
  status: BandSpaceMemberStatus;
  joinedAt: string;
}

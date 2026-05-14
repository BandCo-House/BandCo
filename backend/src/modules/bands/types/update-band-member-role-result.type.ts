import type { BandMemberRole } from '../../../generated/prisma';

export interface UpdateBandMemberRoleResult {
  member: {
    userId: string;
    role: BandMemberRole;
  };
}

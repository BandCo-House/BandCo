import type { JoinRequestStatus } from '../../../generated/prisma';

export interface ApproveBandJoinRequestResult {
  joinRequestId: string;
  bandId: string;
  userId: string;
  joinRequestStatus: JoinRequestStatus;
  joinedAt: string;
}

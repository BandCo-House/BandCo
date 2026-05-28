import type { JoinRequestStatus } from '../../../generated/prisma';

export interface RejectBandJoinRequestResult {
  joinRequestId: string;
  bandId: string;
  userId: string;
  joinRequestStatus: JoinRequestStatus;
}

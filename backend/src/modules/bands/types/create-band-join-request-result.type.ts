import type { JoinRequestStatus } from '../../../generated/prisma';

export interface CreateBandJoinRequestResult {
  joinRequestId: string;
  bandId: string;
  userId: string;
  joinRequestStatus: JoinRequestStatus;
  createdAt: string;
}

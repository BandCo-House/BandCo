import type { JoinRequestStatus } from '../../../generated/prisma';

export interface BandJoinRequestListItem {
  joinRequestId: string;
  requester: {
    userId: string;
    nickname: string;
    avatarUrl: string | null;
  };
  message: string | null;
  joinRequestStatus: JoinRequestStatus;
  createdAt: string;
}

export interface BandJoinRequestCursor {
  id: string;
}

export interface GetBandJoinRequestsResult {
  items: BandJoinRequestListItem[];
  meta: {
    count: number;
    take: number;
    cursor: BandJoinRequestCursor | null;
    next: BandJoinRequestCursor | null;
  };
}

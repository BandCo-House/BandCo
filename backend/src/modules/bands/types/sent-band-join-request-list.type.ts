import type { JoinRequestStatus } from '../../../generated/prisma';

export interface SentBandJoinRequestListItem {
  joinRequestId: string;
  band: {
    bandId: string;
    name: string;
    description: string | null;
    visibility: boolean;
  };
  message: string | null;
  joinRequestStatus: JoinRequestStatus;
  createdAt: string;
}

export interface SentBandJoinRequestCursor {
  id: string;
}

export interface GetSentBandJoinRequestsResult {
  items: SentBandJoinRequestListItem[];
  meta: {
    count: number;
    take: number;
    cursor: SentBandJoinRequestCursor | null;
    next: SentBandJoinRequestCursor | null;
  };
}

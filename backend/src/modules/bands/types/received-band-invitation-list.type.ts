import type { BandInvitationStatus } from '../../../generated/prisma';

export interface ReceivedBandInvitationListItem {
  invitationId: string;
  band: {
    bandId: string;
    name: string;
    description: string | null;
  };
  inviter: {
    userId: string;
    nickname: string;
  };
  message: string | null;
  invitationStatus: BandInvitationStatus;
  createdAt: string;
}

export interface ReceivedBandInvitationCursor {
  id: string;
}

export interface GetReceivedBandInvitationsResult {
  items: ReceivedBandInvitationListItem[];
  meta: {
    count: number;
    take: number;
    cursor: ReceivedBandInvitationCursor | null;
    next: ReceivedBandInvitationCursor | null;
  };
}

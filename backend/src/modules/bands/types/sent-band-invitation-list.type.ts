import type { BandInvitationStatus } from '../../../generated/prisma';

export interface SentBandInvitationListItem {
  invitationId: string;
  band: {
    bandId: string;
    name: string;
    description: string | null;
    memberCount: number;
  };
  invitee: {
    userId: string;
    nickname: string;
    avatarUrl: string | null;
  };
  invitationStatus: BandInvitationStatus;
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface SentBandInvitationCursor {
  id: string;
}

export interface GetSentBandInvitationsResult {
  items: SentBandInvitationListItem[];
  meta: {
    count: number;
    take: number;
    totalCount: number | null;
    cursor: SentBandInvitationCursor | null;
    next: string | null;
  };
}

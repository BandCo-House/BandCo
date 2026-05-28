import type { BandInvitationStatus } from '../../../generated/prisma';

export interface AcceptBandInvitationResult {
  invitationId: string;
  bandId: string;
  userId: string;
  invitationStatus: BandInvitationStatus;
  joinedAt: string;
}

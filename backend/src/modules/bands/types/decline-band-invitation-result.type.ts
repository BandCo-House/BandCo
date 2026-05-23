import type { BandInvitationStatus } from '../../../generated/prisma';

export interface DeclineBandInvitationResult {
  invitationId: string;
  bandId: string;
  userId: string;
  invitationStatus: BandInvitationStatus;
  respondedAt: string;
}

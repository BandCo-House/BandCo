import type { BandInvitationStatus } from '../../../generated/prisma';

export interface CreateBandInvitationResult {
  invitationId: string;
  bandId: string;
  inviterUserId: string;
  inviteeUserId: string;
  invitationStatus: BandInvitationStatus;
  createdAt: string;
}

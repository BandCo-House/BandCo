import type { z } from 'zod';
import {
  inviteSchema,
  inviteStatusSchema,
  receivedBandInvitationListItemSchema,
  getReceivedBandInvitationsResultSchema,
  getBandInvitationResponseSchema,
} from './schema';

export type Invite = z.infer<typeof inviteSchema>;
export type InviteStatus = z.infer<typeof inviteStatusSchema>;
export type ReceivedBandInvitationListItem = z.infer<
  typeof receivedBandInvitationListItemSchema
>;
export type GetReceivedBandInvitationsResult = z.infer<
  typeof getReceivedBandInvitationsResultSchema
>;
export type GetBandInvitationResponse = z.infer<
  typeof getBandInvitationResponseSchema
>;

import type { z } from 'zod';
import {
  inviteStatusSchema,
  receivedBandInvitationListItemSchema,
  getReceivedBandInvitationsResultSchema,
} from './schema';

export type InviteStatus = z.infer<typeof inviteStatusSchema>;
export type ReceivedBandInvitationListItem = z.infer<
  typeof receivedBandInvitationListItemSchema
>;
export type GetReceivedBandInvitationsResult = z.infer<
  typeof getReceivedBandInvitationsResultSchema
>;

import { z } from 'zod';

export const inviteStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
]);

export const receivedBandInvitationListItemSchema = z.object({
  invitationId: z.string(),
  band: z.object({
    bandId: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  }),
  inviter: z.object({
    userId: z.string(),
    nickname: z.string(),
  }),
  message: z.string().nullable(),
  invitationStatus: inviteStatusSchema,
  createdAt: z.string(),
});

export const getReceivedBandInvitationsResultSchema = z.object({
  items: z.array(receivedBandInvitationListItemSchema),
  meta: z.object({
    count: z.number(),
    take: z.number(),
    totalCount: z.number().nullable(),
    cursor: z.object({ id: z.string() }).nullable(),
    next: z.string().nullable(),
  }),
});

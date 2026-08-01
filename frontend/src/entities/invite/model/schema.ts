import { z } from 'zod';

export const inviteStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'DECLINED']);

export const inviteSchema = z.object({
  id: z.string(),
  bandId: z.string(),
  bandName: z.string().default(''),
  inviteeEmail: z.email(),
  inviteCode: z.string().default(''),
  inviteLink: z.string().url().nullable().default(null),
  token: z.string().nullable().default(null),
  status: inviteStatusSchema.default('PENDING'),
});

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

export const getReceivedBandInvitationsResponseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    error: z.null(),
    message: z.string(),
    data: getReceivedBandInvitationsResultSchema,
  }),
  z.object({
    status: z.literal('error'),
    error: z.string().nullable(),
    message: z.string(),
    data: z.unknown().optional(),
  }),
]);

export const getBandInvitationResponseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    error: z.null(),
    message: z.string(),
    data: receivedBandInvitationListItemSchema,
  }),
  z.object({
    status: z.literal('error'),
    error: z.string().nullable(),
    message: z.string(),
    data: z.unknown().optional(),
  }),
]);


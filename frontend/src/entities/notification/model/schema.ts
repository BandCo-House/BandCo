import { z } from 'zod';

export const notificationTypeSchema = z.enum(['NOTICE', 'INVITE', 'REMINDER']);

export const notificationUnreadByTypeSchema = z.object({
  NOTICE: z.number().int().nonnegative(),
  INVITE: z.number().int().nonnegative(),
  REMINDER: z.number().int().nonnegative(),
});

export const notificationUnreadSummarySchema = z.object({
  unreadCount: z.number().int().nonnegative(),
  unreadByType: notificationUnreadByTypeSchema,
});

export const notificationUnreadSummaryResponseSchema = z.discriminatedUnion(
  'status',
  [
    z.object({
      status: z.literal('success'),
      error: z.null(),
      message: z.string(),
      data: notificationUnreadSummarySchema,
    }),
    z.object({
      status: z.literal('error'),
      error: z.string().nullable(),
      message: z.string(),
      data: z.unknown().optional(),
    }),
  ],
);

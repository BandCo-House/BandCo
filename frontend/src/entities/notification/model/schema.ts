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

export const notificationReferenceTypeSchema = z.enum(['BAND_INVITATION']);

export const notificationSenderSchema = z.object({
  userId: z.string(),
  nickname: z.string(),
  avatarUrl: z.string().nullable(),
});

export const notificationReferenceSchema = z.object({
  type: notificationReferenceTypeSchema,
  id: z.string(),
  status: z.string(),
  sender: notificationSenderSchema.nullable(),
});

export const notificationItemSchema = z.object({
  notificationId: z.string().min(1),
  type: notificationTypeSchema,
  title: z.string(),
  description: z.string(),
  isRead: z.boolean(),
  targetPath: z.string().optional(),
  reference: notificationReferenceSchema.nullable().optional(),
  createdAt: z.string(),
});

export const notificationMetaSchema = z.object({
  count: z.number().int().nonnegative(),
  take: z.number().int().positive(),
  next: z.string().nullable(),
});

export const notificationListSchema = z.object({
  items: z.array(notificationItemSchema),
  meta: notificationMetaSchema,
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

export const notificationListResponseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    error: z.null(),
    message: z.string(),
    data: notificationListSchema,
  }),
  z.object({
    status: z.literal('error'),
    error: z.string().nullable(),
    message: z.string(),
    data: z.unknown().optional(),
  }),
]);

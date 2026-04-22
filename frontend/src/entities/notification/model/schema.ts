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

export const notificationItemSchema = z.object({
  notificationId: z.string().min(1),
  type: notificationTypeSchema,
  title: z.string(),
  description: z.string(),
  isRead: z.boolean(),
  targetPath: z.string().optional(),
  createdAt: z.string(),
});

export const notificationPaginationSchema = z.object({
  page: z.number().int().positive(),
  size: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  hasNext: z.boolean(),
});

export const notificationListSchema = z.object({
  items: z.array(notificationItemSchema),
  pagination: notificationPaginationSchema,
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

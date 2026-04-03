import type { z } from 'zod';
import {
  notificationItemSchema,
  notificationListSchema,
  notificationPaginationSchema,
  notificationTypeSchema,
  notificationUnreadByTypeSchema,
  notificationUnreadSummarySchema,
} from './schema';

export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type NotificationList = z.infer<typeof notificationListSchema>;
export type NotificationPagination = z.infer<typeof notificationPaginationSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationUnreadByType = z.infer<typeof notificationUnreadByTypeSchema>;
export type NotificationUnreadSummary = z.infer<typeof notificationUnreadSummarySchema>;

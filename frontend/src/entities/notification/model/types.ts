import type { z } from 'zod';
import {
  notificationTypeSchema,
  notificationUnreadByTypeSchema,
  notificationUnreadSummarySchema,
} from './schema';

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationUnreadByType = z.infer<typeof notificationUnreadByTypeSchema>;
export type NotificationUnreadSummary = z.infer<typeof notificationUnreadSummarySchema>;

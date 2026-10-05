import { z } from 'zod';

export const activeAnnouncementSchema = z.object({
  announcementId: z.string(),
  title: z.string(),
  content: z.string(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
});

export const activeAnnouncementsResponseSchema = z.object({
  announcements: z.array(activeAnnouncementSchema),
});

export type ActiveAnnouncement = z.infer<typeof activeAnnouncementSchema>;

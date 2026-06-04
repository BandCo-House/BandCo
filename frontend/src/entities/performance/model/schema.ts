import { z } from 'zod';

export const performanceSchema = z.object({
  id: z.string(),
  bandId: z.string(),
  spaceId: z.string().nullable().default(null),
  title: z.string(),
  description: z.string().default(''),
  eventDate: z.string(),
  status: z.string().default('PLANNED'),
});

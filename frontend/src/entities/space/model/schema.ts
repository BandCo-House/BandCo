import { z } from 'zod';

export const spaceTypeSchema = z.enum(['PERFORMANCE_PREP', 'PRACTICE']);

export const spaceSchema = z.object({
  id: z.string(),
  bandId: z.string(),
  name: z.string(),
  description: z.string().default(''),
  spaceType: spaceTypeSchema.default('PRACTICE'),
  eventDate: z.string().nullable().default(null),
});

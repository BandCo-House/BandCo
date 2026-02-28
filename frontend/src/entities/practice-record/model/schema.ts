import { z } from 'zod';

export const practiceRecordSchema = z.object({
  id: z.string(),
  scheduleId: z.string().nullable().default(null),
  practicedAt: z.string(),
  label: z.string().default(''),
});

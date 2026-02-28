import { z } from 'zod';

export const sessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number().int().nonnegative().default(0),
});

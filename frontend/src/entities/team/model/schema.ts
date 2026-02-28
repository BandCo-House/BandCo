import { z } from 'zod';

export const teamSchema = z.object({
  id: z.string(),
  songId: z.string(),
  name: z.string(),
  sessionNames: z.array(z.string()).default([]),
  memberIds: z.array(z.string()).default([]),
});

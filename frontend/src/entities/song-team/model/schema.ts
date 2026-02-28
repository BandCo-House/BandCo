import { z } from 'zod';

export const songTeamSchema = z.object({
  id: z.string(),
  songId: z.string(),
  name: z.string(),
  memberCount: z.number().int().nonnegative().default(0),
});

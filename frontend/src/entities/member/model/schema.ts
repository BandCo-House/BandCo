import { z } from 'zod';

export const memberSchema = z.object({
  id: z.string(),
  profileId: z.string().nullable().default(null),
  name: z.string(),
  nickname: z.string().default(''),
  role: z.string().default('MEMBER'),
  instruments: z.array(z.string()).default([]),
  isAssigned: z.boolean().default(false),
});

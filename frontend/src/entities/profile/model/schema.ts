import { z } from 'zod';

export const profileSchema = z.object({
  id: z.string(),
  email: z.email().optional(),
  nickname: z.string().default(''),
  displayName: z.string().default(''),
  bio: z.string().default(''),
  preferredGenres: z.array(z.string()).default([]),
  profileMusic: z
    .object({
      title: z.string(),
      artistName: z.string().default(''),
      url: z.string().url().nullable().default(null),
    })
    .nullable()
    .default(null),
  bandSummaries: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .default([]),
  skills: z.array(z.string()).default([]),
});

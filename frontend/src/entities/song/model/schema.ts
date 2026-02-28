import { z } from 'zod';

export const songSchema = z.object({
  id: z.string(),
  bandId: z.string().optional(),
  title: z.string(),
  artistName: z.string().default(''),
  key: z.string().default(''),
  bpm: z.number().int().positive().nullable().default(null),
  duration: z.string().default(''),
  sourceUrl: z.string().nullable().default(null),
  sourceType: z.string().nullable().default(null),
  referenceLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.string().url(),
      }),
    )
    .default([]),
  sessionNames: z.array(z.string()).default([]),
  teamName: z.string().nullable().default(null),
  participantMemberIds: z.array(z.string()).default([]),
  memo: z.string().default(''),
  status: z.string().default('ACTIVE'),
});

import { z } from 'zod';

export const inviteStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'DECLINED']);

export const inviteSchema = z.object({
  id: z.string(),
  bandId: z.string(),
  bandName: z.string().default(''),
  inviteeEmail: z.email(),
  inviteCode: z.string().default(''),
  inviteLink: z.string().url().nullable().default(null),
  token: z.string().nullable().default(null),
  status: inviteStatusSchema.default('PENDING'),
});

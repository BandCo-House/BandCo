import { z } from 'zod';

export const bandRoleSchema = z.enum(['BM', 'MEMBER', 'ADMIN']);

export const bandSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  visibility: z.boolean(),
  inviteCode: z.string().optional(),
  createdAt: z.string(),
});

export const bandSchema = bandSummarySchema.extend({
  myRole: bandRoleSchema,
  joinedAt: z.string(),
  memberCount: z.number().int().nonnegative().optional(),
});

export const bandListResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  error: z.string().nullable(),
  message: z.string(),
  data: z.object({
    totalCount: z.number().int().nonnegative(),
    items: z.array(bandSchema),
  }),
});

export const createBandResponseSchema = bandSummarySchema.extend({
  bandMasterUserId: z.string(),
});

export type CreateBandResponse = z.infer<typeof createBandResponseSchema>;

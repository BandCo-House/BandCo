import { z } from 'zod';

export const userSkillSchema = z.object({
  skillName: z.string(),
  isPrimary: z.boolean().optional(),
});

export const userSearchItemSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  avatarUrl: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  skills: z.array(userSkillSchema).optional(),
  createdAt: z.string().optional(),
});

export const userSearchResponseSchema = z.object({
  items: z.array(userSearchItemSchema),
  meta: z
    .object({
      count: z.number().optional(),
      take: z.number().optional(),
      cursor: z.unknown().optional(),
      next: z.string().nullable().optional(),
    })
    .optional(),
});

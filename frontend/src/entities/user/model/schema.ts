import { z } from 'zod';

export const userSkillSchema = z.object({
  skillName: z.string(),
  isPrimary: z.boolean().optional(),
});

export const userSearchItemSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  // 닉네임이 겹치는 유저를 가르는 고유 ID. 아직 정하지 않은 유저는 null이다.
  // optional로 두지 않는다 — 빠져도 조용히 통과하면 mock에서만 보이고 실서버에서는 비는 상태가 된다.
  handle: z.string().nullable(),
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

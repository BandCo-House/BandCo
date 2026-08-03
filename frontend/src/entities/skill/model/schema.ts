import { z } from 'zod';

export const skillTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** 백엔드는 `{ skills }`로 감싸 돌려준다. */
export const skillTypeListResponseSchema = z.object({
  skills: z.array(skillTypeSchema),
});

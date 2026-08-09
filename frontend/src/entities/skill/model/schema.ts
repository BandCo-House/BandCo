import { z } from 'zod';

/** 화면이 쓰는 스킬 형태. 백엔드 `skillTypeId`를 `id`로 맞춰 둔다. */
export const skillTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** 백엔드 응답(`GET /common/skills`). `{ skills: [{ skillTypeId, name }] }`로 내려온다. */
export const skillTypeListResponseSchema = z.object({
  skills: z.array(
    z.object({
      skillTypeId: z.string(),
      name: z.string(),
    }),
  ),
});

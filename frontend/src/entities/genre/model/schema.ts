import { z } from 'zod';

export const genreSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** 백엔드는 `{ genres }`로 감싸 돌려준다. */
export const genreListResponseSchema = z.object({
  genres: z.array(genreSchema),
});

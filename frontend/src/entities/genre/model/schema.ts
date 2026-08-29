import { z } from 'zod';

/** 화면이 쓰는 장르 형태. 백엔드 `genreId`를 `id`로 맞춰 둔다. */
export const genreSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/** 백엔드 응답(`GET /common/genres`). `{ genres: [{ genreId, name }] }`로 내려온다. */
export const genreListResponseSchema = z.object({
  genres: z.array(
    z.object({
      genreId: z.string(),
      name: z.string(),
    }),
  ),
});

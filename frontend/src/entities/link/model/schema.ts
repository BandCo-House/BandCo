import { z } from 'zod';

/** 서버가 못 읽은 필드는 null로 정규화해, 화면에서 폴백만 신경 쓰면 되게 한다. */
export const linkPreviewSchema = z.object({
  url: z.string(),
  title: z.string().nullable().default(null),
  siteName: z.string().nullable().default(null),
  faviconUrl: z.string().nullable().default(null),
});

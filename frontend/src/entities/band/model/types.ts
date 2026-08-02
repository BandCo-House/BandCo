import type { z } from 'zod';
import type {
  bandSchema,
  bandDetailSchema,
  bandInviteLinkSchema,
  searchBandItemSchema,
} from './schema';

export type Band = z.infer<typeof bandSchema>;
export type BandDetail = z.infer<typeof bandDetailSchema>;
export type SearchBandItem = z.infer<typeof searchBandItemSchema>;
export type BandInviteLink = z.infer<typeof bandInviteLinkSchema>;

/** 밴드 정보 수정 요청 본문(`PATCH /bands/:bandId`). 보낸 필드만 갱신된다. */
export interface UpdateBandRequest {
  name?: string;
  description?: string | null;
  visibility?: boolean;
  coverImgUrl?: string | null;
}

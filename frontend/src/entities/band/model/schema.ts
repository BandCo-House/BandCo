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

export const bandGenreSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const searchBandItemSchema = z.object({
  id: z.string().optional(),
  bandId: z.string().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  visibility: z.boolean().default(true),
  memberCount: z.number().int().nonnegative().default(0),
  coverImgUrl: z.string().nullable().optional(),
  genres: z.array(bandGenreSchema).optional(),
  createdAt: z.string(),
});

export type SearchBandItem = z.infer<typeof searchBandItemSchema>;

/** 밴드 상세(GET /bands/:bandId). 목록과 필드가 달라 별도 스키마로 둔다. */
export const bandDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().default(null),
  visibility: z.boolean().default(true),
  coverImgUrl: z.string().nullable().default(null),
  bandMasterUserId: z.string(),
  genres: z.array(bandGenreSchema).default([]),
  memberCount: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
});

/**
 * 밴드 초대 링크 발급 결과(`POST /bands/:bandId/invite-link`).
 * 코드는 서버에 해시로만 저장돼 재조회할 수 없고, 발급 응답에서만 원본을 볼 수 있다.
 */
export const bandInviteLinkSchema = z.object({
  bandId: z.string(),
  inviteCode: z.string(),
  expiredAt: z.string(),
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

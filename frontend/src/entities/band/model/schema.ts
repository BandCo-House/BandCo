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
 * 밴드 영구 초대 링크(`GET /bands/:bandId/invite-link`).
 * TODO: 백엔드는 band_invite_link 테이블만 있고 API가 아직 없어 현재는 MSW mock으로만 동작한다.
 */
export const bandInviteLinkSchema = z.object({
  code: z.string(),
  url: z.string(),
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

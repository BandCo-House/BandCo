import { z } from 'zod';

export const spaceTypeSchema = z.enum(['PERFORMANCE', 'PRACTICE', 'ONLINE']);
export const spaceStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

const membershipSchema = z.object({
  isMember: z.boolean(),
  role: z.enum(['LEADER', 'MEMBER']),
});

/**
 * 밴드 스페이스(공연/합주 공간) 스키마.
 * 목록(BandSpaceListItem)과 상세(SpaceDetail.space)를 모두 수용하도록
 * 목록 전용 필드(memberCount/songCount/isMine/myMembership)는 optional로 둔다.
 */
export const bandSpaceSchema = z.object({
  spaceId: z.string(),
  bandId: z.string(),
  name: z.string(),
  description: z.string().default(''),
  spaceType: spaceTypeSchema,
  status: spaceStatusSchema,
  startDate: z.string(),
  endDate: z.string().nullable(),
  memberCount: z.number().int().nonnegative().optional(),
  songCount: z.number().int().nonnegative().optional(),
  isMine: z.boolean().optional(),
  myMembership: membershipSchema.optional(),
  createdByBandMemberId: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

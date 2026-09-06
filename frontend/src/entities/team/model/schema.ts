import { z } from 'zod';

export const teamSchema = z.object({
  id: z.string(),
  songId: z.string(),
  name: z.string(),
  sessionNames: z.array(z.string()).default([]),
  memberIds: z.array(z.string()).default([]),
});

/** 밴드 팀 목록(GET /bands/:bandId/teams) item. */
export const bandTeamListItemSchema = z.object({
  teamId: z.string(),
  name: z.string(),
  description: z.string().nullable().default(null),
  status: z.string().default(''),
  teamCoverUrl: z.string().nullable().default(null),
  memberCount: z.number().default(0),
  teamLeader: z
    .object({ userId: z.string(), nickname: z.string() })
    .nullable()
    .default(null),
  createdAt: z.string().optional(),
});

/** 팀 상세(GET /teams/:teamId) 응답 스키마 */
export const teamDetailSchema = z.object({
  teamId: z.string(),
  bandId: z.string(),
  name: z.string(),
  description: z.string().nullable().default(null),
  status: z.string().default('ACTIVE'),
  teamCoverUrl: z.string().nullable().default(null),
  teamLeader: z
    .object({ userId: z.string(), nickname: z.string() })
    .nullable()
    .default(null),
  memberCount: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/** 팀 멤버 스킬 스키마 */
export const teamMemberSkillSchema = z.object({
  skillTypeId: z.string(),
  skillName: z.string(),
  skillLevel: z.string().default('BEGINNER'),
  isPrimary: z.boolean().default(false),
});

/** 팀 멤버(GET /teams/:teamId/members) item 스키마 */
export const teamMemberSchema = z.object({
  teamMemberId: z.string(),
  bandMemberId: z.string(),
  user: z.object({
    userId: z.string(),
    nickname: z.string(),
    profileImageUrl: z.string().nullable().default(null),
  }),
  teamRole: z.string().default('MEMBER'),
  joinedAt: z.string().optional(),
  skills: z.array(teamMemberSkillSchema).default([]),
  sessionName: z.string().optional(), // UI용 세션명 호환
});


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
/** 이 팀에서 맡은 세션. 개인이 보유한 스킬(skills)과 다른 값이다. */
export const teamMemberSkillTypeSchema = z.object({
  skillTypeId: z.string(),
  name: z.string(),
});

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
  /**
   * 팀 편성상 맡은 세션. 미배정이면 null.
   * optional로 둔 이유: 백엔드가 먼저 배포되기 전까지 이 필드가 없는 응답이 온다.
   */
  skillType: teamMemberSkillTypeSchema.nullable().optional(),
  /** 그 사람이 보유한 스킬 전체. 팀 배정과 무관하다. */
  skills: z.array(teamMemberSkillSchema).default([]),
  sessionName: z.string().optional(), // UI용 세션명 호환
});

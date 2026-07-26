import { z } from 'zod';

/** 밴드 멤버의 플레이 파트(스킬). 세션 칩 표시에 쓴다. */
export const bandMemberSkillSchema = z.object({
  skillTypeId: z.string(),
  skillName: z.string(),
  // 백엔드 SkillLevelType(문자열 enum)과 일치. 숫자가 아니다.
  skillLevel: z
    .enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    .default('BEGINNER'),
  isPrimary: z.boolean().default(false),
});

/** 밴드 멤버 목록(GET /bands/:bandId/users) 한 항목의 응답 계약. */
export const bandMemberListItemSchema = z.object({
  bandMemberId: z.string(),
  userId: z.string(),
  nickname: z.string(),
  avatarUrl: z.string().nullable().default(null),
  role: z.string().default('MEMBER'),
  joinedAt: z.string().optional(),
  // 악기/장비(예: Fender Stratocaster). 백엔드가 아직 안 줄 수 있어 nullable.
  instrument: z.string().nullable().default(null),
  skills: z.array(bandMemberSkillSchema).default([]),
});

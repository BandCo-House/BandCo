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
  // 닉네임이 겹치는 멤버를 가르는 고유 ID. 백엔드 필드명이 확정되면 맞춘다(가정: handle).
  handle: z.string(),
  avatarUrl: z.string().nullable().default(null),
  role: z.string().default('MEMBER'),
  joinedAt: z.string().optional(),
  skills: z.array(bandMemberSkillSchema).default([]),
});

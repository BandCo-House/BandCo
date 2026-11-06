import { z } from 'zod';

/** 백엔드 HANDLE_PATTERN과 같다(DB VARCHAR(8)). */
export const HANDLE_PATTERN = /^[A-Za-z0-9_]{4,8}$/;
export const handleSchema = z
  .string()
  .regex(
    HANDLE_PATTERN,
    '고유 ID는 영문·숫자·밑줄(_)만 써서 4~8자로 입력해주세요.',
  );

export const NICKNAME_MAX_LENGTH = 20;
/**
 * 백엔드는 닉네임을 코드 포인트로 센다(VARCHAR(20)). `string.length`는 이모지를 2로 세서
 * 서버가 받는 이름을 프론트가 막게 되므로 `Array.from`으로 센다.
 */
export const isNicknameWithinMaxLength = (value: string): boolean =>
  Array.from(value).length <= NICKNAME_MAX_LENGTH;

export const userSkillSchema = z.object({
  skillName: z.string(),
  isPrimary: z.boolean().optional(),
});

export const userSearchItemSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  // 닉네임이 겹치는 유저를 가르는 고유 ID. 아직 정하지 않은 유저는 null이다.
  // optional로 두지 않는다 — 빠져도 조용히 통과하면 mock에서만 보이고 실서버에서는 비는 상태가 된다.
  handle: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  skills: z.array(userSkillSchema).optional(),
  createdAt: z.string().optional(),
});

export const userSearchResponseSchema = z.object({
  items: z.array(userSearchItemSchema),
  meta: z
    .object({
      count: z.number().optional(),
      take: z.number().optional(),
      cursor: z.unknown().optional(),
      next: z.string().nullable().optional(),
    })
    .optional(),
});

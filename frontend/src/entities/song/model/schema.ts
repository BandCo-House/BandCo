import { z } from 'zod';

export const songSkillItemSchema = z.object({
  skillTypeId: z.string(),
  skillName: z.string(),
});

/** 밴드 곡 목록(`GET /bands/:bandId/songs`) 한 항목의 응답 계약. */
export const songListItemSchema = z.object({
  id: z.string(),
  bandId: z.string(),
  title: z.string(),
  artistName: z.string().default(''),
  key: z.string().nullable().default(null),
  bpm: z.number().nullable().default(null),
  difficultyLevel: z.number().nullable().default(null),
  sourceUrl: z.string().nullable().default(null),
  sourceType: z.string().nullable().default(null),
  previewUrl: z.string().nullable().default(null),
  albumImageUrl: z.string().nullable().default(null),
  createdAt: z.string(),
  skills: z.array(songSkillItemSchema).default([]),
});

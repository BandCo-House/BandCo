import { z } from 'zod';

export const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export const skillLevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);

export const profileUserDetailSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  status: userStatusSchema,
  createdAt: z.string(),
});

export const profileDetailSchema = z.object({
  nickname: z.string(),
  selfDescription: z.string().nullable(),
  profileMusicUrl: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const userSkillDetailSchema = z.object({
  skillTypeId: z.string(),
  skillName: z.string(),
  level: skillLevelSchema,
  isPrimary: z.boolean(),
});

export const userFavoriteGenreDetailSchema = z.object({
  genreId: z.string(),
  name: z.string(),
});

export const profileSchema = z.object({
  user: profileUserDetailSchema,
  profile: profileDetailSchema.nullable(),
  skills: z.array(userSkillDetailSchema),
  favoriteGenres: z.array(userFavoriteGenreDetailSchema),
});


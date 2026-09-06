import { z } from 'zod';

export const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);
export const skillLevelSchema = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
]);
export const profileMusicSourceTypeSchema = z.enum(['SPOTIFY', 'DEEZER']);

export const profileMusicSchema = z.object({
  externalTrackId: z.string(),
  sourceType: profileMusicSourceTypeSchema,
  title: z.string(),
  artistName: z.string(),
  albumName: z.string(),
  albumImageUrl: z.string().nullable(),
  durationMs: z.number(),
  previewUrl: z.string().nullable(),
  sourceUrl: z.string(),
});

export const profileUserDetailSchema = z.object({
  id: z.string(),
  email: z.string().email().nullable(),
  status: userStatusSchema,
  createdAt: z.string(),
});

export const profileDetailSchema = z.object({
  nickname: z.string(),
  selfDescription: z.string().nullable(),
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

// 백엔드 GetUserProfileResult는 profileMusic을 profile 안이 아니라 최상위에 둔다.
export const profileSchema = z.object({
  user: profileUserDetailSchema,
  profile: profileDetailSchema.nullable(),
  profileMusic: profileMusicSchema.nullable(),
  skills: z.array(userSkillDetailSchema),
  favoriteGenres: z.array(userFavoriteGenreDetailSchema),
});

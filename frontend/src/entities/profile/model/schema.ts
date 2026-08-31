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
  profileMusic: profileMusicSchema.nullable(),
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

/**
 * 백엔드의 최상위 profileMusic을 화면에서 사용하는 profile 내부 구조로 변환한다.
 */
export const profileResponseSchema = z
  .object({
    user: profileUserDetailSchema,
    profile: profileDetailSchema.omit({ profileMusic: true }).nullable(),
    profileMusic: profileMusicSchema.nullable(),
    skills: z.array(userSkillDetailSchema),
    favoriteGenres: z.array(userFavoriteGenreDetailSchema),
  })
  .transform(({ profileMusic, ...result }) =>
    profileSchema.parse({
      ...result,
      profile: result.profile
        ? {
            ...result.profile,
            profileMusic,
          }
        : null,
    }),
  );

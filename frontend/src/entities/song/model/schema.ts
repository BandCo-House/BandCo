import { z } from 'zod';

/** 백엔드 `SongKey` enum. 접미사 없음은 major, `M`은 minor, `S`는 sharp(#)다. */
export const SONG_KEYS = [
  'C',
  'CM',
  'CS',
  'CSM',
  'D',
  'DM',
  'DS',
  'DSM',
  'E',
  'EM',
  'F',
  'FM',
  'FS',
  'FSM',
  'G',
  'GM',
  'GS',
  'GSM',
  'A',
  'AM',
  'AS',
  'ASM',
  'B',
  'BM',
] as const;

export const songKeySchema = z.enum(SONG_KEYS);

const SONG_SOURCE_TYPES = ['SPOTIFY', 'DEEZER'] as const;

export const songSourceTypeSchema = z.enum(SONG_SOURCE_TYPES);

export const songSkillItemSchema = z.object({
  skillTypeId: z.string(),
  skillName: z.string(),
});

export const songReferenceFileSchema = z.object({
  id: z.string(),
  fileUrl: z.string(),
  fileName: z.string(),
  createdAt: z.string(),
});

/** 밴드 곡 목록(`GET /bands/:bandId/songs`) 한 항목의 응답 계약. */
export const songListItemSchema = z.object({
  id: z.string(),
  bandId: z.string(),
  title: z.string(),
  artistName: z.string().default(''),
  key: songKeySchema.nullable().default(null),
  bpm: z.number().nullable().default(null),
  difficultyLevel: z.number().nullable().default(null),
  sourceUrl: z.string().nullable().default(null),
  sourceType: songSourceTypeSchema.nullable().default(null),
  /** 외부 검색으로 등록한 곡만 존재. 미리듣기는 이 ID로 따로 조회한다. */
  externalTrackId: z.string().nullable().default(null),
  songCoverUrl: z.string().nullable().default(null),
  songLength: z.number().nullable().default(null),
  externalLinks: z.array(z.string()).default([]),
  referenceFiles: z.array(songReferenceFileSchema).default([]),
  createdAt: z.string(),
  skills: z.array(songSkillItemSchema).default([]),
});

/** 외부 음원 검색(`GET /songs/tracks/search`) 결과 한 항목. */
export const songPreviewSchema = z.object({
  externalTrackId: z.string(),
  title: z.string(),
  artistName: z.string().default(''),
  albumName: z.string().default(''),
  albumImageUrl: z.string().nullable().default(null),
  releaseDate: z.string().nullable().default(null),
  durationMs: z.number(),
  previewUrl: z.string().nullable().default(null),
  sourceUrl: z.string(),
  sourceType: songSourceTypeSchema,
});

/** 곡 생성(`POST /bands/:bandId/songs`) 응답에서 화면이 쓰는 최소 계약. */
export const createdSongSchema = z.object({
  song: z.object({
    id: z.string(),
    bandId: z.string(),
    title: z.string(),
    artistName: z.string().default(''),
  }),
});

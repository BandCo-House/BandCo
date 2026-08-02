import type { z } from 'zod';
import type {
  createdSongSchema,
  songKeySchema,
  songListItemSchema,
  songPreviewSchema,
  songReferenceFileSchema,
  songSourceTypeSchema,
} from './schema';

export type SongListItem = z.infer<typeof songListItemSchema>;
export type SongPreview = z.infer<typeof songPreviewSchema>;
export type SongReferenceFile = z.infer<typeof songReferenceFileSchema>;
export type SongKey = z.infer<typeof songKeySchema>;
export type SongSourceType = z.infer<typeof songSourceTypeSchema>;
export type CreatedSong = z.infer<typeof createdSongSchema>;

/** 곡 생성 요청 본문(`POST /bands/:bandId/songs`). */
export interface CreateSongRequest {
  title: string;
  artistName: string;
  sourceUrl?: string;
  sourceType?: SongSourceType;
  key?: SongKey;
  bpm?: number;
  songCoverUrl?: string;
  songLength?: number;
  externalLinks?: string[];
  referenceFiles?: { fileUrl: string; fileName: string }[];
}

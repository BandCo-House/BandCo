import type { z } from 'zod';
import type {
  createdSongSchema,
  songKeySchema,
  songListItemSchema,
  songPreviewSchema,
  songSourceTypeSchema,
} from './schema';

export type SongListItem = z.infer<typeof songListItemSchema>;
export type SongPreview = z.infer<typeof songPreviewSchema>;
export type SongKey = z.infer<typeof songKeySchema>;
export type SongSourceType = z.infer<typeof songSourceTypeSchema>;
export type CreatedSong = z.infer<typeof createdSongSchema>;

/** 곡 생성 요청 본문(`POST /bands/:bandId/songs`). */
export interface CreateSongRequest {
  title: string;
  artistName: string;
  sourceUrl?: string;
  sourceType?: SongSourceType;
  /** 외부 검색으로 등록한 곡만 존재한다. 직접 입력한 곡은 없다. */
  externalTrackId?: string;
  key?: SongKey;
  bpm?: number;
  songCoverUrl?: string;
  songLength?: number;
  externalLinks?: string[];
  referenceFiles?: { fileUrl: string; fileName: string }[];
}

/** 곡 수정 요청 본문(`PATCH /songs/:songId`). */
export interface UpdateSongRequest {
  title?: string;
  artistName?: string;
  sourceUrl?: string | null;
  sourceType?: SongSourceType | null;
  key?: SongKey | null;
  bpm?: number | null;
  memo?: string | null;
  songCoverUrl?: string | null;
  songLength?: number | null;
  externalLinks?: string[];
  referenceFiles?: { fileUrl: string; fileName: string }[];
}


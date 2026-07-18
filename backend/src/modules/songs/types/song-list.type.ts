import type { SongKey } from '../../../generated/prisma';

import type { SongSourceType } from './song-preview.type';
import type { SongReferenceFileItem } from './song-reference-file.type';

export interface SongListSkillItem {
  skillTypeId: string;
  skillName: string;
}

export interface SongListItem {
  id: string;
  bandId: string;
  title: string;
  artistName: string;
  key: SongKey | null;
  bpm: number | null;
  difficultyLevel: number | null;
  sourceUrl: string | null;
  sourceType: SongSourceType | null;
  songCoverUrl: string | null;
  songLength: number | null;
  externalLinks: string[];
  referenceFiles: SongReferenceFileItem[];
  createdAt: string;
  skills: SongListSkillItem[];
}

export interface SongListCursor {
  id: string;
}

export interface GetBandSongsResult {
  items: SongListItem[];
  meta: {
    count: number;
    take: number;
    cursor: SongListCursor | null;
    next: SongListCursor | null;
  };
}

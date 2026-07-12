import type { SongKey } from '../../../generated/prisma';

import type { SongSourceType } from './song-preview.type';
import type { SongReferenceFileItem } from './song-reference-file.type';

export interface CreatedSongSkillType {
  id: string;
  name: string;
}

export interface CreateSongResult {
  song: {
    id: string;
    bandId: string;
    title: string;
    artistName: string;
    sourceUrl: string | null;
    sourceType: SongSourceType | null;
    memo: string | null;
    key: SongKey | null;
    bpm: number | null;
    difficultyLevel: number | null;
    songCoverUrl: string | null;
    songLength: number | null;
    externalLinks: string[];
    referenceFiles: SongReferenceFileItem[];
    userId: string;
    createdAt: string;
  };
  skillTypes: CreatedSongSkillType[];
}

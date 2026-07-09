import type { SongKey } from '../../../generated/prisma';

import type { SongListSkillItem } from './song-list.type';
import type { SongSourceType } from './song-preview.type';
import type { SongReferenceFileItem } from './song-reference-file.type';

export interface UpdateSongResult {
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
    updatedAt: string;
    skills: SongListSkillItem[];
  };
}

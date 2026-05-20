import type { Prisma } from '../../../generated/prisma';
import type { CreateSongInput } from '../dto/create-song.dto';
import type { CreateSongResult } from '../types/create-song-result.type';

export const SONGS_REPOSITORY = Symbol('SONGS_REPOSITORY');

export interface CreateSongRepositoryInput extends CreateSongInput {
  bandId: string;
  userId: string;
  createdByBandMemberId: string;
  skillTypeIds: string[];
}

export interface SongsRepository {
  findBandForSongCreate(
    bandId: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{
    id: string;
    member: {
      id: string;
      userId: string;
    } | null;
  } | null>;
  findExistingSkillTypeIds(skillTypeIds: string[], tx?: Prisma.TransactionClient): Promise<string[]>;
  createSong(input: CreateSongRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateSongResult>;
}

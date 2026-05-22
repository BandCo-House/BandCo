import type { Prisma } from '../../../generated/prisma';
import type { CreateSongInput } from '../dto/create-song.dto';
import type { GetBandSongsQuery } from '../dto/get-band-songs-query.dto';
import type { UpdateSongInput } from '../dto/update-song.dto';
import type { CreateSongResult } from '../types/create-song-result.type';
import type { DeleteSongResult } from '../types/delete-song-result.type';
import type { ActiveBandWithMember, SongWithBandMember } from '../types/song-access-context.type';
import type { GetBandSongsResult } from '../types/song-list.type';
import type { UpdateSongResult } from '../types/update-song-result.type';

export const SONGS_REPOSITORY = Symbol('SONGS_REPOSITORY');

export interface CreateSongRepositoryInput extends CreateSongInput {
  bandId: string;
  userId: string;
  createdByBandMemberId: string;
  skillTypeIds: string[];
}

export interface SongsRepository {
  findActiveBandWithMemberByBandIdAndUserId(bandId: string, userId: string, tx?: Prisma.TransactionClient): Promise<ActiveBandWithMember | null>;
  createSong(input: CreateSongRepositoryInput, tx?: Prisma.TransactionClient): Promise<CreateSongResult>;
  findBandSongs(bandId: string, query: GetBandSongsQuery, tx?: Prisma.TransactionClient): Promise<GetBandSongsResult>;
  findSongWithBandMemberBySongIdAndUserId(songId: string, userId: string, tx?: Prisma.TransactionClient): Promise<SongWithBandMember | null>;
  updateSong(songId: string, input: UpdateSongInput, tx?: Prisma.TransactionClient): Promise<UpdateSongResult>;
  deleteSong(songId: string, deletedAt: Date, tx?: Prisma.TransactionClient): Promise<DeleteSongResult | undefined>;
}

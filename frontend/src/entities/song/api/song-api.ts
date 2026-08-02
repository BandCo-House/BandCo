import { z } from 'zod';
import { apiGet, apiPost } from '@/shared/api';
import {
  createdSongSchema,
  songListItemSchema,
  songPreviewSchema,
} from '../model/schema';
import type {
  CreateSongRequest,
  CreatedSong,
  SongListItem,
  SongPreview,
} from '../model/types';

export interface GetBandSongsParams {
  where__title__contain?: string;
  where__artist_name__contain?: string;
  take?: number;
  cursor__id?: string;
}

interface GetBandSongsResult {
  items: unknown[];
  meta?: unknown;
}

const songListSchema = z.array(songListItemSchema);
const songPreviewListSchema = z.array(songPreviewSchema);

/**
 * 밴드 합주곡 목록을 조회한다.
 * 백엔드는 `{ items, meta }`를 돌려주므로 items만 파싱해 반환한다.
 */
export const getBandSongs = async (
  bandId: string,
  params?: GetBandSongsParams,
): Promise<SongListItem[]> => {
  const data = await apiGet<GetBandSongsResult>(`/bands/${bandId}/songs`, {
    params,
  });
  return songListSchema.parse(data.items);
};

/** 외부 음원(Deezer)에서 곡을 검색한다. */
export const searchTracks = async (query: string): Promise<SongPreview[]> => {
  const data = await apiGet<unknown[]>('/songs/tracks/search', {
    params: { query },
  });
  return songPreviewListSchema.parse(data);
};

/** 밴드 라이브러리에 합주곡을 추가한다. */
export const createSong = async (
  bandId: string,
  body: CreateSongRequest,
): Promise<CreatedSong> => {
  const data = await apiPost<unknown>(`/bands/${bandId}/songs`, body);
  return createdSongSchema.parse(data);
};

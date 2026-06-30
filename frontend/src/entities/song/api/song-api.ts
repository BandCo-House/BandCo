import { z } from 'zod';
import { apiGet } from '@/shared/api';
import { songListItemSchema } from '../model/schema';
import type { SongListItem } from '../model/types';

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

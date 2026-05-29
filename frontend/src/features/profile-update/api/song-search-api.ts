import { z } from 'zod';
import { apiGet } from '@/shared/api';

export const songPreviewSchema = z.object({
  externalTrackId: z.string(),
  title: z.string(),
  artistName: z.string(),
  albumName: z.string(),
  albumImageUrl: z.string().nullable(),
  releaseDate: z.string().nullable(),
  durationMs: z.number(),
  previewUrl: z.string().nullable(),
  sourceUrl: z.string(),
  sourceType: z.enum(['SPOTIFY', 'DEEZER']),
});

export type SongPreview = z.infer<typeof songPreviewSchema>;

export const searchSongPreviews = async (
  query: string,
): Promise<SongPreview[]> => {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) return [];

  const result = await apiGet<unknown[]>('/songs/deezer/tracks/search', {
    params: { query: normalizedQuery },
  });

  return z.array(songPreviewSchema).parse(result);
};

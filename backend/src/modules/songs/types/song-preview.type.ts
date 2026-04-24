export type SongSourceType = 'SPOTIFY' | 'DEEZER';

export interface SongPreview {
  externalTrackId: string;
  title: string;
  artistName: string;
  albumName: string;
  albumImageUrl: string | null;
  releaseDate: string | null;
  durationMs: number;
  previewUrl: string | null;
  sourceUrl: string;
  sourceType: SongSourceType;
}

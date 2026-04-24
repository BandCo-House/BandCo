export interface SpotifySongPreview {
  spotifyTrackId: string;
  title: string;
  artistName: string;
  albumName: string;
  albumImageUrl: string | null;
  releaseDate: string;
  durationMs: number;
  previewUrl: string | null;
  sourceUrl: string;
  sourceType: 'SPOTIFY';
}

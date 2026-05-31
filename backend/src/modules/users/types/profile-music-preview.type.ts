export interface ProfileMusicPreview {
  externalTrackId: string;
  sourceType: 'DEEZER';
  title: string;
  artistName: string;
  albumName: string;
  albumImageUrl: string | null;
  durationMs: number;
  previewUrl: string | null;
  sourceUrl: string;
}

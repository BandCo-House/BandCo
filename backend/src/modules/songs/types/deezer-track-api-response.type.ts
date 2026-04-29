export interface DeezerTrackArtistApiResponse {
  name: string;
}

export interface DeezerTrackAlbumApiResponse {
  title: string;
  cover: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
}

export interface DeezerTrackApiResponse {
  id: number;
  title: string;
  duration: number;
  link: string;
  preview: string | null;
  artist: DeezerTrackArtistApiResponse;
  album: DeezerTrackAlbumApiResponse;
}

export interface DeezerTrackSearchApiResponse {
  data: DeezerTrackApiResponse[];
  total: number;
  next?: string;
}

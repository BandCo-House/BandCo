export interface SpotifyTrackArtistApiResponse {
  name: string;
}

export interface SpotifyTrackAlbumImageApiResponse {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyTrackAlbumApiResponse {
  name: string;
  release_date: string;
  images: SpotifyTrackAlbumImageApiResponse[];
}

export interface SpotifyTrackExternalUrlsApiResponse {
  spotify?: string;
}

export interface SpotifyTrackApiResponse {
  id: string;
  name: string;
  duration_ms: number;
  artists: SpotifyTrackArtistApiResponse[];
  album: SpotifyTrackAlbumApiResponse;
  external_urls: SpotifyTrackExternalUrlsApiResponse;
  preview_url: string | null;
}

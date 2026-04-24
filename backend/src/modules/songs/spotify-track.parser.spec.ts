import assert from 'node:assert/strict';

import test from 'node:test';

import type { SpotifyTrackApiResponse } from './types/spotify-track-api-response.type';
import { parseSpotifyTrackToSongPreview } from './spotify-track.parser';

test('Spotify track 응답을 곡 미리보기 데이터로 변환한다', () => {
  const spotifyTrack: SpotifyTrackApiResponse = {
    id: '11dFghVXANMlKmJXsNCbNl',
    name: 'Cut To The Feeling',
    duration_ms: 207959,
    preview_url: null,
    artists: [
      {
        name: 'Carly Rae Jepsen',
      },
    ],
    album: {
      name: 'Cut To The Feeling',
      release_date: '2017-05-26',
      images: [
        {
          url: 'https://i.scdn.co/image/demo',
          width: 640,
          height: 640,
        },
      ],
    },
    external_urls: {
      spotify: 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl',
    },
  };

  const result = parseSpotifyTrackToSongPreview(spotifyTrack);

  assert.equal(result.externalTrackId, '11dFghVXANMlKmJXsNCbNl');
  assert.equal(result.title, 'Cut To The Feeling');
  assert.equal(result.artistName, 'Carly Rae Jepsen');
  assert.equal(result.albumName, 'Cut To The Feeling');
  assert.equal(result.albumImageUrl, 'https://i.scdn.co/image/demo');
  assert.equal(result.releaseDate, '2017-05-26');
  assert.equal(result.durationMs, 207959);
  assert.equal(result.previewUrl, null);
  assert.equal(result.sourceUrl, 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl');
  assert.equal(result.sourceType, 'SPOTIFY');
});

test('Spotify track URL이 없으면 track ID로 sourceUrl을 만든다', () => {
  const spotifyTrack: SpotifyTrackApiResponse = {
    id: 'missing-url-track-id',
    name: 'Demo Song',
    duration_ms: 180000,
    preview_url: 'https://p.scdn.co/mp3-preview/demo',
    artists: [
      {
        name: 'Artist A',
      },
      {
        name: 'Artist B',
      },
    ],
    album: {
      name: 'Demo Album',
      release_date: '2026-04-11',
      images: [],
    },
    external_urls: {},
  };

  const result = parseSpotifyTrackToSongPreview(spotifyTrack);

  assert.equal(result.artistName, 'Artist A, Artist B');
  assert.equal(result.albumImageUrl, null);
  assert.equal(result.sourceUrl, 'https://open.spotify.com/track/missing-url-track-id');
});

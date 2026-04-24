import assert from 'node:assert/strict';

import test from 'node:test';

import { SongsService } from './songs.service';
import type { SpotifyTrackReader } from './spotify-track.client';

test('Spotify 곡 미리보기 서비스는 Spotify track 조회를 위임한다', async () => {
  let capturedTrackId: string | undefined;

  const spotifyTrackReader: SpotifyTrackReader = {
    async findTrack(trackId) {
      capturedTrackId = trackId;

      return {
        id: trackId,
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
          images: [],
        },
        external_urls: {
          spotify: 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl',
        },
      };
    },
  };
  const service = new SongsService(spotifyTrackReader);

  const result = await service.previewSpotifyTrack('11dFghVXANMlKmJXsNCbNl');

  assert.equal(capturedTrackId, '11dFghVXANMlKmJXsNCbNl');
  assert.equal(result.title, 'Cut To The Feeling');
  assert.equal(result.sourceType, 'SPOTIFY');
});

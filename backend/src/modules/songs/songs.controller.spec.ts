import assert from 'node:assert/strict';

import test from 'node:test';

import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import type { SpotifyTrackReader } from './spotify-track.client';

test('Spotify 곡 미리보기 컨트롤러는 공통 성공 응답 형식을 반환한다', async () => {
  const spotifyTrackReader: SpotifyTrackReader = {
    async findTrack(trackId) {
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
  const controller = new SongsController(service);

  const response = await controller.getSpotifyTrackPreview('11dFghVXANMlKmJXsNCbNl');

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, 'Spotify 곡 미리보기 조회 성공');
  assert.equal(response.data.spotifyTrackId, '11dFghVXANMlKmJXsNCbNl');
  assert.equal(response.data.title, 'Cut To The Feeling');
});

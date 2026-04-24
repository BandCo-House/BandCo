import assert from 'node:assert/strict';

import test from 'node:test';

import type { DeezerTrackSearcher } from './deezer-track.client';
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
  const deezerTrackSearcher: DeezerTrackSearcher = {
    async searchTracks() {
      throw new Error('Spotify 조회 테스트에서는 Deezer를 호출하지 않습니다.');
    },
  };
  const service = new SongsService(spotifyTrackReader, deezerTrackSearcher);

  const result = await service.previewSpotifyTrack('11dFghVXANMlKmJXsNCbNl');

  assert.equal(capturedTrackId, '11dFghVXANMlKmJXsNCbNl');
  assert.equal(result.title, 'Cut To The Feeling');
  assert.equal(result.sourceType, 'SPOTIFY');
});

test('Deezer 곡 미리보기 서비스는 Deezer track 검색 결과를 목록으로 변환한다', async () => {
  let capturedQuery: string | undefined;

  const spotifyTrackReader: SpotifyTrackReader = {
    async findTrack() {
      throw new Error('Deezer 조회 테스트에서는 Spotify를 호출하지 않습니다.');
    },
  };
  const deezerTrackSearcher: DeezerTrackSearcher = {
    async searchTracks(query) {
      capturedQuery = query;

      return [
        {
          id: 3135556,
          title: 'Harder, Better, Faster, Stronger',
          duration: 224,
          link: 'https://www.deezer.com/track/3135556',
          preview: 'https://cdns-preview.dzcdn.net/stream/demo.mp3',
          artist: {
            name: 'Daft Punk',
          },
          album: {
            title: 'Discovery',
            cover: 'https://api.deezer.com/album/302127/image',
            cover_medium: 'https://e-cdns-images.dzcdn.net/images/cover/medium.jpg',
            cover_big: 'https://e-cdns-images.dzcdn.net/images/cover/big.jpg',
            cover_xl: 'https://e-cdns-images.dzcdn.net/images/cover/xl.jpg',
          },
        },
      ];
    },
  };
  const service = new SongsService(spotifyTrackReader, deezerTrackSearcher);

  const result = await service.searchDeezerTrackPreviews('Daft Punk Harder Better Faster Stronger');

  assert.equal(capturedQuery, 'Daft Punk Harder Better Faster Stronger');
  assert.equal(result.length, 1);
  assert.equal(result[0]?.externalTrackId, '3135556');
  assert.equal(result[0]?.title, 'Harder, Better, Faster, Stronger');
  assert.equal(result[0]?.sourceType, 'DEEZER');
});

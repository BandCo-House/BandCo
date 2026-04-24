import assert from 'node:assert/strict';

import { BadRequestException } from '@nestjs/common';
import test from 'node:test';

import type { DeezerTrackSearcher } from './deezer-track.client';
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
  const deezerTrackSearcher: DeezerTrackSearcher = {
    async searchTracks() {
      throw new Error('Spotify 컨트롤러 테스트에서는 Deezer를 호출하지 않습니다.');
    },
  };
  const service = new SongsService(spotifyTrackReader, deezerTrackSearcher);
  const controller = new SongsController(service);

  const response = await controller.getSpotifyTrackPreview('11dFghVXANMlKmJXsNCbNl');

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, 'Spotify 곡 미리보기 조회 성공');
  assert.equal(response.data.externalTrackId, '11dFghVXANMlKmJXsNCbNl');
  assert.equal(response.data.title, 'Cut To The Feeling');
});

test('Deezer 곡 미리보기 컨트롤러는 공통 성공 응답 형식으로 목록을 반환한다', async () => {
  const spotifyTrackReader: SpotifyTrackReader = {
    async findTrack() {
      throw new Error('Deezer 컨트롤러 테스트에서는 Spotify를 호출하지 않습니다.');
    },
  };
  const deezerTrackSearcher: DeezerTrackSearcher = {
    async searchTracks(query) {
      assert.equal(query, 'Daft Punk Harder Better Faster Stronger');

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
  const controller = new SongsController(service);

  const response = await controller.searchDeezerTrackPreviews(' Daft Punk Harder Better Faster Stronger ');

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, 'Deezer 곡 미리보기 목록 조회 성공');
  assert.equal(response.data.length, 1);
  assert.equal(response.data[0]?.externalTrackId, '3135556');
  assert.equal(response.data[0]?.sourceType, 'DEEZER');
});

test('Deezer 곡 미리보기 컨트롤러는 query가 없으면 예외를 던진다', async () => {
  const spotifyTrackReader: SpotifyTrackReader = {
    async findTrack() {
      throw new Error('query 검증 실패 시 Spotify를 호출하지 않습니다.');
    },
  };
  const deezerTrackSearcher: DeezerTrackSearcher = {
    async searchTracks() {
      throw new Error('query 검증 실패 시 Deezer를 호출하지 않습니다.');
    },
  };
  const service = new SongsService(spotifyTrackReader, deezerTrackSearcher);
  const controller = new SongsController(service);

  await assert.rejects(async () => {
    await controller.searchDeezerTrackPreviews('   ');
  }, BadRequestException);
});

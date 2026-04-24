import assert from 'node:assert/strict';

import test from 'node:test';

import type { DeezerTrackApiResponse } from './types/deezer-track-api-response.type';
import { parseDeezerTrackToSongPreview } from './deezer-track.parser';

test('Deezer track 응답을 곡 미리보기 데이터로 변환한다', () => {
  const deezerTrack: DeezerTrackApiResponse = {
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
  };

  const result = parseDeezerTrackToSongPreview(deezerTrack);

  assert.equal(result.externalTrackId, '3135556');
  assert.equal(result.title, 'Harder, Better, Faster, Stronger');
  assert.equal(result.artistName, 'Daft Punk');
  assert.equal(result.albumName, 'Discovery');
  assert.equal(result.albumImageUrl, 'https://e-cdns-images.dzcdn.net/images/cover/xl.jpg');
  assert.equal(result.releaseDate, null);
  assert.equal(result.durationMs, 224000);
  assert.equal(result.previewUrl, 'https://cdns-preview.dzcdn.net/stream/demo.mp3');
  assert.equal(result.sourceUrl, 'https://www.deezer.com/track/3135556');
  assert.equal(result.sourceType, 'DEEZER');
});

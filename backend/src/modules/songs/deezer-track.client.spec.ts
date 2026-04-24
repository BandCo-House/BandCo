import assert from 'node:assert/strict';

import test from 'node:test';

import { DeezerTrackClient } from './deezer-track.client';

const originalFetch = globalThis.fetch;

function restoreFetch(): void {
  globalThis.fetch = originalFetch;
}

test('Deezer track client는 검색어로 track 목록을 조회한다', async t => {
  t.after(restoreFetch);

  let requestedUrl: string | undefined;

  globalThis.fetch = async input => {
    requestedUrl = String(input);

    return new Response(
      JSON.stringify({
        data: [
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
        ],
        total: 1,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  };

  const client = new DeezerTrackClient();

  const result = await client.searchTracks('Daft Punk Harder Better Faster Stronger');

  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, 3135556);
  assert.equal(requestedUrl, 'https://api.deezer.com/search/track?q=Daft+Punk+Harder+Better+Faster+Stronger&limit=10');
});

test('Deezer track client는 검색 결과가 없으면 빈 배열을 반환한다', async t => {
  t.after(restoreFetch);

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        data: [],
        total: 0,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

  const client = new DeezerTrackClient();

  const result = await client.searchTracks('검색 결과 없는 곡');

  assert.deepEqual(result, []);
});

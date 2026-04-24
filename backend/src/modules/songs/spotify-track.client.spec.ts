import assert from 'node:assert/strict';

import test from 'node:test';

import { SpotifyTrackClient } from './spotify-track.client';

const originalFetch = globalThis.fetch;
const originalSpotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const originalSpotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

function restoreGlobals(): void {
  globalThis.fetch = originalFetch;

  if (originalSpotifyClientId === undefined) {
    delete process.env.SPOTIFY_CLIENT_ID;
  } else {
    process.env.SPOTIFY_CLIENT_ID = originalSpotifyClientId;
  }

  if (originalSpotifyClientSecret === undefined) {
    delete process.env.SPOTIFY_CLIENT_SECRET;
  } else {
    process.env.SPOTIFY_CLIENT_SECRET = originalSpotifyClientSecret;
  }
}

test('Spotify track client는 client credentials 토큰을 발급받아 track API를 호출한다', async t => {
  t.after(restoreGlobals);

  process.env.SPOTIFY_CLIENT_ID = 'spotify-client-id';
  process.env.SPOTIFY_CLIENT_SECRET = 'spotify-client-secret';

  const requestedUrls: string[] = [];
  const requestedAuthorizations: string[] = [];

  globalThis.fetch = async (input, init) => {
    const requestUrl = String(input);
    requestedUrls.push(requestUrl);

    if (requestUrl === 'https://accounts.spotify.com/api/token') {
      return new Response(
        JSON.stringify({
          access_token: 'issued-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const headers = new Headers(init?.headers);
    requestedAuthorizations.push(headers.get('Authorization') ?? '');

    return new Response(
      JSON.stringify({
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
          images: [],
        },
        external_urls: {
          spotify: 'https://open.spotify.com/track/11dFghVXANMlKmJXsNCbNl',
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  };

  const client = new SpotifyTrackClient();

  const result = await client.findTrack('11dFghVXANMlKmJXsNCbNl');

  assert.equal(result.id, '11dFghVXANMlKmJXsNCbNl');
  assert.deepEqual(requestedUrls, ['https://accounts.spotify.com/api/token', 'https://api.spotify.com/v1/tracks/11dFghVXANMlKmJXsNCbNl']);
  assert.deepEqual(requestedAuthorizations, ['Bearer issued-access-token']);
});

test('Spotify track client는 발급받은 토큰이 유효하면 재사용한다', async t => {
  t.after(restoreGlobals);

  process.env.SPOTIFY_CLIENT_ID = 'spotify-client-id';
  process.env.SPOTIFY_CLIENT_SECRET = 'spotify-client-secret';

  let tokenRequestCount = 0;

  globalThis.fetch = async input => {
    const requestUrl = String(input);

    if (requestUrl === 'https://accounts.spotify.com/api/token') {
      tokenRequestCount += 1;

      return new Response(
        JSON.stringify({
          access_token: 'cached-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        id: '11dFghVXANMlKmJXsNCbNl',
        name: 'Cut To The Feeling',
        duration_ms: 207959,
        preview_url: null,
        artists: [],
        album: {
          name: 'Cut To The Feeling',
          release_date: '2017-05-26',
          images: [],
        },
        external_urls: {},
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  };

  const client = new SpotifyTrackClient();

  await client.findTrack('11dFghVXANMlKmJXsNCbNl');
  await client.findTrack('11dFghVXANMlKmJXsNCbNl');

  assert.equal(tokenRequestCount, 1);
});

import { isYoutubeUrl } from './youtube-oembed.client';

describe('isYoutubeUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=LjhCEhWiKXk',
    'https://youtu.be/LjhCEhWiKXk',
    'https://m.youtube.com/watch?v=LjhCEhWiKXk',
    'https://music.youtube.com/watch?v=LjhCEhWiKXk',
    'https://YOUTUBE.com/watch?v=LjhCEhWiKXk',
  ])('유튜브 호스트면 true를 반환한다: %s', url => {
    expect(isYoutubeUrl(url)).toBe(true);
  });

  it.each(['https://www.youtube.com.evil.example/watch?v=1', 'https://example.com/youtube.com', 'not-a-url'])(
    '유튜브 호스트가 아니면 false를 반환한다: %s',
    url => {
      expect(isYoutubeUrl(url)).toBe(false);
    },
  );
});

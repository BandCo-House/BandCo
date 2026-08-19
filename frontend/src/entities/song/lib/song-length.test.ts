import { describe, expect, it } from 'vitest';
import { formatSongLength, parseSongLength } from './song-length';

describe('formatSongLength', () => {
  it('초를 m:ss로 표시한다', () => {
    expect(formatSongLength(277)).toBe('4:37');
    expect(formatSongLength(202)).toBe('3:22');
    expect(formatSongLength(60)).toBe('1:00');
  });

  it('값이 없으면 빈 문자열을 돌려준다', () => {
    expect(formatSongLength(null)).toBe('');
    expect(formatSongLength(undefined)).toBe('');
  });
});

describe('parseSongLength', () => {
  it('m:ss 입력을 초로 되돌린다', () => {
    expect(parseSongLength('4:37')).toBe(277);
    expect(parseSongLength(' 3:22 ')).toBe(202);
  });

  it('형식이 어긋나면 null을 돌려준다', () => {
    expect(parseSongLength('437')).toBeNull();
    expect(parseSongLength('4:60')).toBeNull();
    expect(parseSongLength('4:7')).toBeNull();
    expect(parseSongLength('')).toBeNull();
  });
});

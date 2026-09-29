import { describe, expect, it } from 'vitest';
import type { SongPreview } from '@/entities/song/model/types';
import {
  applyManualEntryToForm,
  applyTrackToForm,
  applyVideoPreviewToForm,
  createEmptyForm,
  getOriginalCoverUrl,
  isExternalLinkValid,
  isFormValid,
  parseVideoTitle,
  toCreateSongRequest,
} from './types';

const track: SongPreview = {
  externalTrackId: 'track-1',
  title: 'Wonderwall',
  artistName: 'Oasis',
  albumName: "(What's the Story) Morning Glory?",
  albumImageUrl: 'https://example.com/album.jpg',
  releaseDate: '1995-10-02',
  durationMs: 277_000,
  previewUrl: 'https://example.com/preview.mp3',
  sourceUrl: 'https://www.deezer.com/track/1',
  sourceType: 'DEEZER',
};

describe('applyTrackToForm', () => {
  it('검색으로 고른 곡의 제목·아티스트·곡 길이·앨범아트를 채운다', () => {
    const form = applyTrackToForm(createEmptyForm(), track);

    expect(form.title).toBe('Wonderwall');
    expect(form.artistName).toBe('Oasis');
    expect(form.songLength).toBe('4:37');
    expect(form.coverSource).toBe('album');
  });

  it('외부 검색이 주지 못하는 조성·BPM은 비워 둔다', () => {
    const form = applyTrackToForm(createEmptyForm(), track);

    expect(form.songKey).toBeNull();
    expect(form.bpm).toBe('');
  });

  it('앨범아트가 없는 곡은 커버를 빈 상태로 둔다', () => {
    const form = applyTrackToForm(createEmptyForm(), {
      ...track,
      albumImageUrl: null,
    });

    expect(form.coverSource).toBe('none');
  });

  it('이미 입력한 외부 링크는 유지한다', () => {
    const withLink = {
      ...createEmptyForm(),
      externalLinks: ['https://youtu.be/abc'],
    };

    expect(applyTrackToForm(withLink, track).externalLinks).toEqual([
      'https://youtu.be/abc',
    ]);
  });
});

describe('applyManualEntryToForm', () => {
  it('앞서 고른 트랙에서 온 제목·아티스트를 비우고 외부 음원 연결을 끊는다', () => {
    const searched = applyTrackToForm(createEmptyForm(), track);
    const form = applyManualEntryToForm(searched);

    expect(form.title).toBe('');
    expect(form.artistName).toBe('');
    expect(form.track).toBeNull();
    expect(form.coverSource).toBe('none');
    expect(form.isManualEntry).toBe(true);
  });

  it('트랙 없이 직접 친 제목은 그대로 둔다', () => {
    const typed = { ...createEmptyForm(), title: '자작곡 1' };

    expect(applyManualEntryToForm(typed).title).toBe('자작곡 1');
  });

  it('직접 입력 뒤 다시 검색으로 곡을 고르면 직접 입력 상태가 풀린다', () => {
    const manual = applyManualEntryToForm(createEmptyForm());
    const form = applyTrackToForm(manual, track);

    expect(form.isManualEntry).toBe(false);
  });
});

describe('parseVideoTitle', () => {
  it('"가수 - 제목 (Official Video)"를 가수와 제목으로 나누고 꾸밈 괄호를 뗀다', () => {
    expect(
      parseVideoTitle(
        'Bruno Mars - Count On Me (Official Video)',
        'Bruno Mars',
      ),
    ).toEqual({ title: 'Count On Me', artistName: 'Bruno Mars' });
  });

  it('앞뒤로 여러 겹 붙은 괄호도 모두 뗀다', () => {
    expect(
      parseVideoTitle('[MV] DAY6 – 한 페이지가 될 수 있게 (Live) [4K]', null),
    ).toEqual({ title: '한 페이지가 될 수 있게', artistName: 'DAY6' });
  });

  it('구분자가 없으면 제목 전체를 곡 제목으로, 채널 이름을 아티스트로 둔다', () => {
    expect(parseVideoTitle('Count On Me', 'Bruno Mars - Topic')).toEqual({
      title: 'Count On Me',
      artistName: 'Bruno Mars',
    });
  });
});

describe('applyVideoPreviewToForm', () => {
  const preview = {
    url: 'https://youtu.be/abc',
    title: 'Bruno Mars - Count On Me (Official Video)',
    siteName: 'YouTube',
    faviconUrl: null,
    imageUrl: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
    authorName: 'Bruno Mars',
  };

  it('제목·아티스트 초안과 썸네일 커버를 채우고 링크를 외부 링크에 단다', () => {
    const form = applyVideoPreviewToForm(
      applyManualEntryToForm(createEmptyForm()),
      preview,
    );

    expect(form.title).toBe('Count On Me');
    expect(form.artistName).toBe('Bruno Mars');
    expect(form.coverSource).toBe('album');
    expect(getOriginalCoverUrl(form)).toBe(preview.imageUrl);
    expect(form.externalLinks).toEqual(['https://youtu.be/abc']);
  });

  it('직접 올린 커버는 썸네일로 바꾸지 않고, 이미 단 링크는 중복으로 달지 않는다', () => {
    const base = {
      ...createEmptyForm(),
      coverSource: 'custom' as const,
      externalLinks: ['https://youtu.be/abc'],
    };
    const form = applyVideoPreviewToForm(base, preview);

    expect(form.coverSource).toBe('custom');
    expect(form.externalLinks).toEqual(['https://youtu.be/abc']);
  });
});

describe('isFormValid', () => {
  const filled = {
    ...createEmptyForm(),
    title: 'Wonderwall',
    artistName: 'Oasis',
  };

  it('제목과 아티스트가 모두 있어야 제출할 수 있다', () => {
    expect(isFormValid(filled)).toBe(true);
    expect(isFormValid({ ...filled, artistName: '  ' })).toBe(false);
    expect(isFormValid({ ...filled, title: '' })).toBe(false);
  });

  it('BPM·곡 길이는 비워도 되지만 형식이 어긋나면 막는다', () => {
    expect(isFormValid({ ...filled, bpm: '', songLength: '' })).toBe(true);
    expect(isFormValid({ ...filled, bpm: '0' })).toBe(false);
    expect(isFormValid({ ...filled, bpm: '백이십' })).toBe(false);
    expect(isFormValid({ ...filled, songLength: '437' })).toBe(false);
  });
});

describe('isExternalLinkValid', () => {
  it('http(s) 주소만 통과시킨다', () => {
    expect(isExternalLinkValid('https://youtu.be/abc')).toBe(true);
    expect(isExternalLinkValid('http://example.com')).toBe(true);
  });

  it('스킴이 없거나 http(s)가 아니면 막는다', () => {
    expect(isExternalLinkValid('youtu.be/abc')).toBe(false);
    expect(isExternalLinkValid('그냥 메모')).toBe(false);
    expect(isExternalLinkValid('javascript:alert(1)')).toBe(false);
    expect(isExternalLinkValid('')).toBe(false);
  });
});

describe('toCreateSongRequest', () => {
  it('검색으로 고른 곡은 음원 출처를 함께 싣는다', () => {
    const form = {
      ...applyTrackToForm(createEmptyForm(), track),
      songKey: 'FSM' as const,
      bpm: '120',
    };

    const request = toCreateSongRequest(form, {
      songCoverUrl: track.albumImageUrl ?? undefined,
    });

    expect(request).toMatchObject({
      title: 'Wonderwall',
      artistName: 'Oasis',
      sourceUrl: 'https://www.deezer.com/track/1',
      sourceType: 'DEEZER',
      externalTrackId: 'track-1',
      key: 'FSM',
      bpm: 120,
      songLength: 277,
      songCoverUrl: 'https://example.com/album.jpg',
    });
  });

  it('직접 입력한 곡은 음원 출처 없이 보내고 빈 값은 싣지 않는다', () => {
    const form = {
      ...createEmptyForm(),
      title: '  자작곡  ',
      artistName: '  우리밴드  ',
    };

    const request = toCreateSongRequest(form, {});

    expect(request.title).toBe('자작곡');
    expect(request.artistName).toBe('우리밴드');
    expect(request.sourceUrl).toBeUndefined();
    expect(request.sourceType).toBeUndefined();
    expect(request.externalTrackId).toBeUndefined();
    expect(request.key).toBeUndefined();
    expect(request.bpm).toBeUndefined();
    expect(request.songLength).toBeUndefined();
    expect(request.externalLinks).toBeUndefined();
    expect(request.referenceFiles).toBeUndefined();
  });

  it('업로드한 참고 자료와 외부 링크를 그대로 싣는다', () => {
    const form = {
      ...createEmptyForm(),
      title: '곡',
      artistName: '아티스트',
      externalLinks: ['https://youtu.be/abc'],
    };

    const request = toCreateSongRequest(form, {
      referenceFiles: [{ fileUrl: 'https://cdn/1.pdf', fileName: '악보.pdf' }],
    });

    expect(request.externalLinks).toEqual(['https://youtu.be/abc']);
    expect(request.referenceFiles).toEqual([
      { fileUrl: 'https://cdn/1.pdf', fileName: '악보.pdf' },
    ]);
  });
});

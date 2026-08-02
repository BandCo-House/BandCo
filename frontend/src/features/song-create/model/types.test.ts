import { describe, expect, it } from 'vitest';
import type { SongPreview } from '@/entities/song/model/types';
import {
  applyManualEntryToForm,
  applyTrackToForm,
  createEmptyForm,
  isFormValid,
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
  it('검색어를 곡 제목 초안으로 넘기고 외부 음원 연결을 끊는다', () => {
    const searched = applyTrackToForm(createEmptyForm(), track);
    const form = applyManualEntryToForm(searched, '누구누구 유튜브 커버');

    expect(form.title).toBe('누구누구 유튜브 커버');
    expect(form.track).toBeNull();
    expect(form.coverSource).toBe('none');
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

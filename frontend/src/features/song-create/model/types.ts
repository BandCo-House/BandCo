import {
  parseSongLength,
  formatSongLength,
} from '@/entities/song/lib/song-length';
import type { LinkPreview } from '@/entities/link/model/types';
import type {
  CreateSongRequest,
  SongKey,
  SongPreview,
} from '@/entities/song/model/types';

/** 커버 이미지 출처. 앨범아트(검색 원본) / 직접 올린 이미지 / 비움. */
export type SongCoverSource = 'album' | 'custom' | 'none';

export interface SongFormState {
  title: string;
  artistName: string;
  /** 검색으로 고른 원본 트랙. sourceUrl 전송과 '기본 이미지로'(앨범아트 복원)에 쓴다. */
  track: SongPreview | null;
  /** 검색에서 "직접 입력하기"로 넘어왔는지. 유튜브 링크 입력과 안내 문구를 보여주는 데 쓴다. */
  isManualEntry: boolean;
  /** 유튜브 링크에서 가져온 영상 썸네일. 검색 트랙이 없을 때 앨범아트 대신 원본 커버가 된다. */
  linkCoverUrl: string | null;
  coverSource: SongCoverSource;
  coverFile: File | null;
  /** 직접 올린 커버의 blob 미리보기 URL. */
  coverPreviewUrl: string | null;
  referenceFiles: File[];
  externalLinks: string[];
  songKey: SongKey | null;
  /** 정수 문자열. 빈 값은 미입력이다. */
  bpm: string;
  /** `m:ss` 문자열. 빈 값은 미입력이다. */
  songLength: string;
}

export const createEmptyForm = (): SongFormState => ({
  title: '',
  artistName: '',
  track: null,
  isManualEntry: false,
  linkCoverUrl: null,
  coverSource: 'none',
  coverFile: null,
  coverPreviewUrl: null,
  referenceFiles: [],
  externalLinks: [],
  songKey: null,
  bpm: '',
  songLength: '',
});

/**
 * 검색으로 고른 곡 → 폼 값. 외부 검색이 주지 못하는 조성·BPM은 비워 두고
 * 사용자가 직접 채우게 한다. 이미 입력한 참고 자료·링크는 유지한다.
 */
export const applyTrackToForm = (
  form: SongFormState,
  track: SongPreview,
): SongFormState => ({
  ...form,
  title: track.title,
  artistName: track.artistName,
  track,
  isManualEntry: false,
  linkCoverUrl: null,
  coverSource: track.albumImageUrl ? 'album' : 'none',
  coverFile: null,
  coverPreviewUrl: null,
  songLength: formatSongLength(Math.round(track.durationMs / 1000)),
});

/**
 * 원하는 곡이 검색에 없어 직접 입력으로 빠질 때.
 * 검색어는 "Count on me Bruno Mars"처럼 제목·가수가 섞여 있어 제목으로 넘기지 않고 비운다.
 * 앞서 고른 트랙이 있었다면 그 트랙에서 온 값(아티스트·곡 길이·앨범아트)도 비운다.
 * 남겨 두면 직접 입력한 곡이 남의 아티스트·재생시간을 달고 저장된다.
 */
export const applyManualEntryToForm = (form: SongFormState): SongFormState => {
  const hadTrack = form.track !== null;

  return {
    ...form,
    title: hadTrack ? '' : form.title,
    track: null,
    isManualEntry: true,
    artistName: hadTrack ? '' : form.artistName,
    songLength: hadTrack ? '' : form.songLength,
    coverSource: form.coverSource === 'album' ? 'none' : form.coverSource,
  };
};

// 영상 제목 앞뒤의 "[MV]", "(Official Video)" 같은 꾸밈 괄호.
const LEADING_BRACKET_PATTERN = /^\s*[[(【][^\])】]*[\])】]\s*/;
const TRAILING_BRACKET_PATTERN = /\s*[[(【][^\])】]*[\])】]\s*$/;
// "가수 - 제목" 구분자. 하이픈·엔대시·엠대시를 모두 받는다.
const ARTIST_TITLE_SEPARATOR = /\s+[-–—]\s+/;
// 유튜브가 음원마다 자동으로 만드는 "가수 - Topic" 채널.
const TOPIC_CHANNEL_SUFFIX = /\s+-\s+Topic$/;

const stripDecorativeBrackets = (text: string): string => {
  let stripped = text.trim();
  let previous = '';
  // 괄호가 여러 겹 붙은 제목("... (Official Video) [4K]")이 있어 더 줄지 않을 때까지 벗긴다.
  while (stripped !== previous) {
    previous = stripped;
    stripped = stripped
      .replace(LEADING_BRACKET_PATTERN, '')
      .replace(TRAILING_BRACKET_PATTERN, '')
      .trim();
  }
  return stripped;
};

/**
 * 영상 제목·채널 이름 → 곡 제목·아티스트 초안.
 * 공식 영상은 대개 "가수 - 제목 (Official Video)" 형태라 구분자로 나눈다.
 * 구분자가 없으면 제목 전체를 곡 제목으로, 채널 이름을 아티스트로 둔다.
 * 커버 영상이면 채널이 커버한 사람이라 틀릴 수 있어, 어디까지나 사용자가 다듬을 초안이다.
 *
 * @param videoTitle - 유튜브 영상 제목
 * @param authorName - 유튜브 채널 이름
 * @returns 곡 제목과 아티스트 초안
 */
export const parseVideoTitle = (
  videoTitle: string,
  authorName: string | null,
): { title: string; artistName: string } => {
  const cleanedTitle = stripDecorativeBrackets(videoTitle);
  const [artistPart, ...titleParts] = cleanedTitle.split(
    ARTIST_TITLE_SEPARATOR,
  );
  const hasSeparator = titleParts.length > 0;

  if (hasSeparator) {
    return {
      title: stripDecorativeBrackets(titleParts.join(' - ')),
      artistName: artistPart.trim(),
    };
  }

  return {
    title: cleanedTitle,
    artistName: (authorName ?? '').replace(TOPIC_CHANNEL_SUFFIX, '').trim(),
  };
};

/**
 * 유튜브 링크 미리보기 → 폼 값. 사용자가 "불러오기"를 누른 명시적 동작이라
 * 제목·아티스트는 덮어쓴다. 직접 올린 커버는 사용자가 고른 것이라 썸네일로 바꾸지 않는다.
 */
export const applyVideoPreviewToForm = (
  form: SongFormState,
  preview: LinkPreview,
): SongFormState => {
  const draft = preview.title
    ? parseVideoTitle(preview.title, preview.authorName)
    : { title: form.title, artistName: form.artistName };
  const hasThumbnail = preview.imageUrl !== null;
  const keepsCustomCover = form.coverSource === 'custom';
  const alreadyLinked = form.externalLinks.includes(preview.url);

  return {
    ...form,
    title: draft.title,
    artistName: draft.artistName,
    linkCoverUrl: preview.imageUrl,
    coverSource: hasThumbnail && !keepsCustomCover ? 'album' : form.coverSource,
    externalLinks: alreadyLinked
      ? form.externalLinks
      : [...form.externalLinks, preview.url],
  };
};

/** 되돌릴 수 있는 원본 커버. 검색 트랙의 앨범아트가 우선이고, 없으면 유튜브 썸네일이다. */
export const getOriginalCoverUrl = (form: SongFormState): string | null =>
  form.track?.albumImageUrl ?? form.linkCoverUrl;

const BPM_PATTERN = /^\d{1,3}$/;

/** 외부 링크는 http(s) URL만 받는다. 임의 문자열이 저장되면 어디서도 열 수 없다. */
export const isExternalLinkValid = (link: string): boolean => {
  try {
    const { protocol } = new URL(link.trim());
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
};

export const isBpmValid = (bpm: string): boolean =>
  bpm.trim() === '' || (BPM_PATTERN.test(bpm.trim()) && Number(bpm) > 0);

export const isSongLengthValid = (songLength: string): boolean =>
  songLength.trim() === '' || parseSongLength(songLength) !== null;

/** 제목·아티스트가 필수이고, 선택 입력은 형식이 맞아야 제출할 수 있다. */
export const isFormValid = (form: SongFormState): boolean =>
  form.title.trim().length > 0 &&
  form.artistName.trim().length > 0 &&
  isBpmValid(form.bpm) &&
  isSongLengthValid(form.songLength);

interface UploadedAssets {
  /** 업로드/앨범아트로 확정된 커버 URL. 비움 상태면 undefined. */
  songCoverUrl?: string;
  referenceFiles?: { fileUrl: string; fileName: string }[];
}

/** 폼 상태 + 업로드 결과 → 곡 생성 요청 본문. 빈 값은 아예 싣지 않는다. */
export const toCreateSongRequest = (
  form: SongFormState,
  uploaded: UploadedAssets,
): CreateSongRequest => {
  const bpm = form.bpm.trim();
  const songLength = parseSongLength(form.songLength);

  return {
    title: form.title.trim(),
    artistName: form.artistName.trim(),
    sourceUrl: form.track?.sourceUrl,
    sourceType: form.track?.sourceType,
    externalTrackId: form.track?.externalTrackId,
    key: form.songKey ?? undefined,
    bpm: bpm ? Number(bpm) : undefined,
    songCoverUrl: uploaded.songCoverUrl,
    songLength: songLength ?? undefined,
    externalLinks: form.externalLinks.length ? form.externalLinks : undefined,
    referenceFiles: uploaded.referenceFiles?.length
      ? uploaded.referenceFiles
      : undefined,
  };
};

import {
  parseSongLength,
  formatSongLength,
} from '@/entities/song/lib/song-length';
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
  coverSource: track.albumImageUrl ? 'album' : 'none',
  coverFile: null,
  coverPreviewUrl: null,
  songLength: formatSongLength(Math.round(track.durationMs / 1000)),
});

/** 검색 결과가 없어 직접 입력으로 빠질 때. 검색어를 곡 제목 초안으로 넘긴다. */
export const applyManualEntryToForm = (
  form: SongFormState,
  query: string,
): SongFormState => ({
  ...form,
  title: query,
  track: null,
  coverSource: form.coverSource === 'album' ? 'none' : form.coverSource,
});

const BPM_PATTERN = /^\d{1,3}$/;

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

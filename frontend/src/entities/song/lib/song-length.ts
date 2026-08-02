const SONG_LENGTH_PATTERN = /^(\d{1,3}):([0-5]\d)$/;

/** 초 단위 곡 길이를 `m:ss`로 표시한다. */
export const formatSongLength = (
  seconds: number | null | undefined,
): string => {
  if (seconds === null || seconds === undefined) return '';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
};

/**
 * `m:ss` 입력을 초로 되돌린다. 형식이 어긋나면 null을 돌려준다.
 * (백엔드 `songLength`가 초 단위 정수라 전송 직전에 변환한다)
 */
export const parseSongLength = (text: string): number | null => {
  const matched = SONG_LENGTH_PATTERN.exec(text.trim());
  if (!matched) return null;
  return Number(matched[1]) * 60 + Number(matched[2]);
};

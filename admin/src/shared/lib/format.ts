const KST_TIME_ZONE = 'Asia/Seoul';
const KST_OFFSET = '+09:00';
const EMPTY_TEXT = '-';

const kstPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: KST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

interface KstParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
}

const toKstParts = (date: Date): KstParts => {
  const parts = Object.fromEntries(
    kstPartsFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
  };
};

const parseDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** ISO 문자열을 KST `YYYY-MM-DD HH:mm`으로 표시한다. 값이 없으면 `-`. */
export const formatDateTime = (
  value: string | Date | null | undefined,
): string => {
  const date = parseDate(value);
  if (!date) {
    return EMPTY_TEXT;
  }
  const { year, month, day, hour, minute } = toKstParts(date);
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

/** KST 기준 날짜 `YYYY-MM-DD`. */
export const formatKstDate = (value: string | Date): string => {
  const date = parseDate(value);
  if (!date) {
    return EMPTY_TEXT;
  }
  const { year, month, day } = toKstParts(date);
  return `${year}-${month}-${day}`;
};

/** 기준 시각에서 days일 전(음수면 후)의 KST 날짜 `YYYY-MM-DD`. */
export const getKstDateDaysAgo = (days: number, now: Date): string =>
  formatKstDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));

/**
 * `datetime-local` 입력값(KST로 해석)을 ISO 문자열로 바꾼다. 빈 값이면 null.
 * 운영자가 어느 시간대에서 접속하든 화면 표기(KST)와 입력 기준을 맞추기 위해 KST로 고정한다.
 */
export const kstInputToIso = (value: string): string | null => {
  if (!value) {
    return null;
  }
  const withSeconds = value.length === 16 ? `${value}:00` : value;
  const date = new Date(`${withSeconds}${KST_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

/** ISO 문자열을 `datetime-local` 입력값(KST `YYYY-MM-DDTHH:mm`)으로 바꾼다. */
export const isoToKstInput = (value: string | null | undefined): string => {
  const date = parseDate(value);
  if (!date) {
    return '';
  }
  const { year, month, day, hour, minute } = toKstParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];

/** 바이트 수를 1024 단위로 읽기 쉽게 표시한다. 예: 1536 → `1.5 KB` */
export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  if (exponent === 0) {
    return `${bytes} B`;
  }
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(1)} ${BYTE_UNITS[exponent]}`;
};

const numberFormatter = new Intl.NumberFormat('ko-KR');

export const formatNumber = (value: number): string =>
  numberFormatter.format(value);

/** base 대비 count의 비율(%)을 소수 첫째 자리까지. base가 0이면 `-`. */
export const formatPercent = (count: number, base: number): string => {
  if (base <= 0) {
    return EMPTY_TEXT;
  }
  return `${((count / base) * 100).toFixed(1)}%`;
};

/** null·빈 문자열을 `-`로 표시한다. */
export const orDash = (value: string | null | undefined): string =>
  value ? value : EMPTY_TEXT;

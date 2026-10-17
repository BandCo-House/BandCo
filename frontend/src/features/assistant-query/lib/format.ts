const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const formatDateTime = (iso: string | null): string =>
  iso === null ? '시간 미정' : dateTimeFormatter.format(new Date(iso));

/** 결과 셀을 화면 문자열로 바꾼다. 날짜로 표시된 열은 한국 시간으로 보여준다. */
export const formatResultCell = (
  value: string | number | boolean | null | undefined,
  format: 'plain' | 'datetime',
): string => {
  if (value === null || value === undefined) return '없음';
  if (
    format === 'datetime' &&
    typeof value === 'string' &&
    Number.isFinite(Date.parse(value))
  )
    return formatDateTime(value);
  if (typeof value === 'boolean') return value ? '예' : '아니요';
  return String(value);
};

/** 큰 숫자로 보여줄 수 있는 값인지. 서버는 bigint·Decimal을 숫자 문자열로 보낸다. */
export const isNumericValue = (value: unknown): boolean =>
  typeof value === 'number' ||
  (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value));

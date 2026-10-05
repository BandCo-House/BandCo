// URL 검색 파라미터를 안전하게 읽기 위한 파서 모음

export const parsePage = (value: unknown): number | undefined => {
  const page = Number(value);
  return Number.isInteger(page) && page > 1 ? page : undefined;
};

export const parseText = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const parseEnum = <T extends string>(
  value: unknown,
  allowed: ReadonlyArray<T>,
): T | undefined => (allowed.includes(value as T) ? (value as T) : undefined);

export const parseFlag = (value: unknown): true | undefined =>
  value === true || value === 'true' ? true : undefined;

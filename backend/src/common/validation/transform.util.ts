import type { TransformFnParams } from 'class-transformer';

/**
 * 필수 문자열 입력은 검증 전에 앞뒤 공백만 제거한다.
 *
 * @param {TransformFnParams} params - class-transformer가 전달한 원본 값
 * @returns {unknown} 공백을 제거한 문자열 또는 원본 값
 */
export function trimStringValue({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value.trim();
}

/**
 * 선택 문자열은 공백만 들어오면 값이 없는 것으로 정리한다.
 *
 * @param {TransformFnParams} params - class-transformer가 전달한 원본 값
 * @returns {unknown} 정리된 문자열 또는 undefined
 */
export function normalizeOptionalStringValue({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return undefined;
  }

  return trimmedValue;
}

/**
 * 쿼리 문자열의 boolean 값을 명시적으로 boolean 으로 바꾼다.
 *
 * @param {TransformFnParams} params - class-transformer가 전달한 원본 값
 * @returns {unknown} boolean 으로 바뀐 값 또는 원본 값
 */
export function parseOptionalBooleanValue({ value }: TransformFnParams): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}

/**
 * 양의 정수 쿼리는 검증 전에 number 로 바꿔 둔다.
 *
 * @param {TransformFnParams} params - class-transformer가 전달한 원본 값
 * @returns {unknown} 숫자로 변환한 값 또는 원본 값
 */
export function parseOptionalPositiveIntegerValue({ value }: TransformFnParams): unknown {
  if (value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue)) {
    return value;
  }

  return parsedValue;
}

/**
 * 선택 날짜 문자열을 Date 로 변환한다.
 *
 * @param {TransformFnParams} params - class-transformer가 전달한 원본 값
 * @returns {unknown} Date 로 변환한 값 또는 원본 값
 */
export function parseOptionalDateValue({ value }: TransformFnParams): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return undefined;
  }

  const parsedDate = new Date(trimmedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate;
}

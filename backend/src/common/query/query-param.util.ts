import { BadRequestException } from '@nestjs/common';

/**
 * 빈 문자열을 의미 없는 입력으로 보고 undefined 로 정리한다.
 *
 * @param value 원본 쿼리 문자열
 * @returns 조건 분기에서 바로 사용할 수 있는 문자열 또는 undefined
 */
export function normalizeOptionalString(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return undefined;
  }

  return trimmedValue;
}

/**
 * 양의 정수만 허용하는 쿼리 파라미터를 검증한다.
 *
 * @param value 원본 쿼리 문자열
 * @param fieldName 에러 메시지에 표시할 필드명
 * @param defaultValue 값이 없을 때 사용할 기본값
 * @returns 검증이 끝난 양의 정수
 */
export function parseOptionalPositiveInteger(value: string | undefined, fieldName: string, defaultValue: number): number {
  if (value === undefined) {
    return defaultValue;
  }

  const parsedValue = Number(value);
  const isInteger = Number.isInteger(parsedValue);
  const isPositive = parsedValue > 0;

  if (!isInteger || !isPositive) {
    throw new BadRequestException(`${fieldName}는 1 이상의 정수여야 합니다.`);
  }

  return parsedValue;
}

/**
 * boolean 성격의 쿼리 문자열을 명시적으로 변환한다.
 *
 * @param value 원본 쿼리 문자열
 * @param fieldName 에러 메시지에 표시할 필드명
 * @returns boolean 값 또는 undefined
 */
export function parseOptionalBoolean(value: string | undefined, fieldName: string): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new BadRequestException(`${fieldName}는 true 또는 false 여야 합니다.`);
}

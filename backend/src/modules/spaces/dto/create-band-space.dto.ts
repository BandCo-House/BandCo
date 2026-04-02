import { BadRequestException } from '@nestjs/common';

import { normalizeOptionalString } from '../../../common/query';
import type { SpaceStatus, SpaceType } from '../types/band-space-list-item.type';

export interface CreateBandSpaceRequestBody {
  name?: unknown;
  description?: unknown;
  spaceType?: unknown;
  status?: unknown;
  startDate?: unknown;
  endDate?: unknown;
}

export interface CreateBandSpaceInput {
  name: string;
  description: string;
  spaceType: SpaceType;
  status: SpaceStatus;
  startDate: string;
  endDate: string;
}

const ALLOWED_SPACE_TYPES: readonly SpaceType[] = ['PRACTICE_ROOM', 'STUDIO', 'ONLINE', 'ETC'] as const;
const ALLOWED_SPACE_STATUSES: readonly SpaceStatus[] = ['ACTIVE', 'INACTIVE'] as const;

/**
 * 합주 공간 생성 요청 본문을 서비스에서 바로 쓸 수 있는 형태로 정리한다.
 *
 * @param {CreateBandSpaceRequestBody} body - 컨트롤러에서 받은 원본 요청 본문
 * @returns {CreateBandSpaceInput} 검증이 끝난 합주 공간 생성 입력값
 */
export function parseCreateBandSpaceBody(body: CreateBandSpaceRequestBody): CreateBandSpaceInput {
  const name = parseRequiredString(body.name, 'name');
  const description = parseRequiredString(body.description, 'description');
  const spaceType = parseEnumValue(body.spaceType, 'spaceType', ALLOWED_SPACE_TYPES);
  const status = parseEnumValue(body.status, 'status', ALLOWED_SPACE_STATUSES);
  const startDate = parseDateOnly(body.startDate, 'startDate');
  const endDate = parseDateOnly(body.endDate, 'endDate');

  if (startDate > endDate) {
    throw new BadRequestException('startDate는 endDate보다 늦을 수 없습니다.');
  }

  return {
    name,
    description,
    spaceType,
    status,
    startDate,
    endDate,
  };
}

/**
 * 필수 문자열 입력을 검증하고 공백만 들어온 값은 거른다.
 *
 * @param {unknown} value - 요청 본문에서 받은 값
 * @param {string} fieldName - 에러 메시지에 표시할 필드명
 * @returns {string} 검증이 끝난 문자열 값
 */
function parseRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName}는 문자열이어야 합니다.`);
  }

  const normalizedValue = normalizeOptionalString(value);

  if (normalizedValue === undefined) {
    throw new BadRequestException(`${fieldName}는 비어 있을 수 없습니다.`);
  }

  return normalizedValue;
}

/**
 * 허용한 enum 문자열만 통과시킨다.
 *
 * @param {unknown} value - 요청 본문에서 받은 값
 * @param {string} fieldName - 에러 메시지에 표시할 필드명
 * @param {readonly T[]} allowedValues - 허용할 enum 값 목록
 * @returns {T} 검증이 끝난 enum 값
 */
function parseEnumValue<T extends string>(value: unknown, fieldName: string, allowedValues: readonly T[]): T {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName}는 문자열이어야 합니다.`);
  }

  if (!allowedValues.includes(value as T)) {
    throw new BadRequestException(`${fieldName}는 허용된 값만 사용할 수 있습니다.`);
  }

  return value as T;
}

/**
 * yyyy-mm-dd 형식 날짜 문자열만 허용한다.
 *
 * @param {unknown} value - 요청 본문에서 받은 값
 * @param {string} fieldName - 에러 메시지에 표시할 필드명
 * @returns {string} 검증이 끝난 날짜 문자열
 */
function parseDateOnly(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName}는 yyyy-mm-dd 문자열이어야 합니다.`);
  }

  const normalizedValue = normalizeOptionalString(value);

  if (normalizedValue === undefined) {
    throw new BadRequestException(`${fieldName}는 비어 있을 수 없습니다.`);
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(normalizedValue)) {
    throw new BadRequestException(`${fieldName}는 yyyy-mm-dd 형식이어야 합니다.`);
  }

  const parsedDate = new Date(`${normalizedValue}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new BadRequestException(`${fieldName}가 올바른 날짜가 아닙니다.`);
  }

  return normalizedValue;
}

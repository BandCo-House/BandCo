import { BadRequestException } from '@nestjs/common';

import { normalizeOptionalString } from '../../../common/query';

export interface CreateBandRequestBody {
  name?: unknown;
  description?: unknown;
  visibility?: unknown;
}

export interface CreateBandInput {
  name: string;
  description: string;
  visibility: boolean;
}

/**
 * 밴드 생성 요청 본문을 검증하고 서비스에서 바로 쓸 수 있는 형태로 바꾼다.
 *
 * @param {CreateBandRequestBody} body - 컨트롤러에서 받은 원본 요청 본문
 * @returns {CreateBandInput} 검증이 끝난 밴드 생성 입력값
 */
export function parseCreateBandBody(body: CreateBandRequestBody): CreateBandInput {
  return {
    name: parseRequiredString(body.name, 'name'),
    description: parseRequiredString(body.description, 'description'),
    visibility: parseRequiredBoolean(body.visibility, 'visibility'),
  };
}

/**
 * 필수 문자열을 검증하고 공백 입력은 막는다.
 *
 * @param {unknown} value - 요청 본문에서 받은 값
 * @param {string} fieldName - 에러 메시지에 표시할 필드명
 * @returns {string} 검증이 끝난 문자열
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
 * 공개 여부는 boolean 값만 허용한다.
 *
 * @param {unknown} value - 요청 본문에서 받은 값
 * @param {string} fieldName - 에러 메시지에 표시할 필드명
 * @returns {boolean} 검증이 끝난 boolean 값
 */
function parseRequiredBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new BadRequestException(`${fieldName}는 boolean 이어야 합니다.`);
  }

  return value;
}

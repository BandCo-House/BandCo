import { BadRequestException } from '@nestjs/common';

import type { SpaceMemberRole } from '../types/band-space-list-item.type';

export interface AddSpaceMemberRequestBody {
  userId?: unknown;
  role?: unknown;
}

export interface AddSpaceMemberInput {
  userId: string;
  role: SpaceMemberRole;
}

const ALLOWED_SPACE_MEMBER_ROLES: readonly SpaceMemberRole[] = ['LEADER', 'MEMBER'] as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 합주 공간 멤버 추가 요청 본문을 검증한다.
 *
 * @param {AddSpaceMemberRequestBody} body - 컨트롤러에서 받은 원본 요청 본문
 * @returns {AddSpaceMemberInput} 검증이 끝난 멤버 추가 입력값
 */
export function parseAddSpaceMemberBody(body: AddSpaceMemberRequestBody): AddSpaceMemberInput {
  const userId = parseRequiredUuid(body.userId, 'userId');
  const role = parseSpaceMemberRole(body.role);

  return {
    userId,
    role,
  };
}

/**
 * 사용자 ID는 UUID 문자열만 허용한다.
 *
 * @param {unknown} value - 요청 본문에서 받은 값
 * @param {string} fieldName - 에러 메시지에 표시할 필드명
 * @returns {string} 검증이 끝난 UUID 문자열
 */
function parseRequiredUuid(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new BadRequestException(`${fieldName}는 UUID 문자열이어야 합니다.`);
  }

  if (!UUID_PATTERN.test(value)) {
    throw new BadRequestException(`${fieldName}는 올바른 UUID 형식이어야 합니다.`);
  }

  return value;
}

/**
 * 역할이 없으면 기본 멤버로 처리하고, 허용하지 않은 값은 막는다.
 *
 * @param {unknown} value - 요청 본문에서 받은 값
 * @returns {SpaceMemberRole} 검증이 끝난 멤버 역할
 */
function parseSpaceMemberRole(value: unknown): SpaceMemberRole {
  if (value === undefined) {
    return 'MEMBER';
  }

  if (typeof value !== 'string') {
    throw new BadRequestException('role은 문자열이어야 합니다.');
  }

  if (!ALLOWED_SPACE_MEMBER_ROLES.includes(value as SpaceMemberRole)) {
    throw new BadRequestException('role은 허용된 값만 사용할 수 있습니다.');
  }

  return value as SpaceMemberRole;
}

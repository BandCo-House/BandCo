import { BadRequestException } from '@nestjs/common';

import { normalizeOptionalString, parseOptionalBoolean, parseOptionalPositiveInteger } from '../../../common/query';

export interface GetNotificationsQueryParams {
  isRead?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: string;
  size?: string;
  sort?: string;
}

export type NotificationListType = 'INVITE' | 'NOTICE' | 'REMINDER';

export interface GetNotificationsQuery {
  isRead?: boolean;
  type?: NotificationListType;
  from?: Date;
  to?: Date;
  page: number;
  size: number;
  sort?: string;
}

/**
 * 알림 목록 조회 쿼리를 서비스와 repository에서 바로 사용할 수 있는 형태로 정리한다.
 *
 * @param {GetNotificationsQueryParams} params - 컨트롤러가 받은 원본 쿼리 문자열
 * @returns {GetNotificationsQuery} 검증과 변환이 끝난 알림 목록 조회 조건
 */
export function parseGetNotificationsQuery(params: GetNotificationsQueryParams): GetNotificationsQuery {
  const parsedFrom = parseOptionalDateTime(params.from, 'from');
  const parsedTo = parseOptionalDateTime(params.to, 'to');

  if (parsedFrom !== undefined && parsedTo !== undefined && parsedFrom.getTime() > parsedTo.getTime()) {
    throw new BadRequestException('from은 to보다 늦을 수 없습니다.');
  }

  return {
    isRead: parseOptionalBoolean(params.isRead, 'isRead'),
    type: parseOptionalNotificationType(params.type),
    from: parsedFrom,
    to: parsedTo,
    page: parseOptionalPositiveInteger(params.page, 'page', 1),
    size: parseOptionalPositiveInteger(params.size, 'size', 20),
    sort: normalizeOptionalString(params.sort),
  };
}

/**
 * 알림 타입은 현재 목록 화면에서 사용하는 세 값만 허용한다.
 *
 * @param {string | undefined} value - 원본 타입 문자열
 * @returns {NotificationListType | undefined} 검증이 끝난 알림 타입
 */
function parseOptionalNotificationType(value: string | undefined): NotificationListType | undefined {
  const normalizedValue = normalizeOptionalString(value);

  if (normalizedValue === undefined) {
    return undefined;
  }

  if (normalizedValue === 'INVITE' || normalizedValue === 'NOTICE' || normalizedValue === 'REMINDER') {
    return normalizedValue;
  }

  throw new BadRequestException('type은 INVITE, NOTICE, REMINDER 중 하나여야 합니다.');
}

/**
 * 날짜 조건은 ISO-8601 문자열만 허용하고, 잘못된 값은 즉시 막는다.
 *
 * @param {string | undefined} value - 원본 날짜 문자열
 * @param {string} fieldName - 에러 메시지에 표시할 필드명
 * @returns {Date | undefined} 검증이 끝난 Date 객체
 */
function parseOptionalDateTime(value: string | undefined, fieldName: string): Date | undefined {
  const normalizedValue = normalizeOptionalString(value);

  if (normalizedValue === undefined) {
    return undefined;
  }

  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new BadRequestException(`${fieldName}은 ISO-8601 형식의 날짜여야 합니다.`);
  }

  return parsedDate;
}

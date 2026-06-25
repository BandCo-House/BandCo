import { BadRequestException } from '@nestjs/common';

type OrderDirection = 'asc' | 'desc';

export interface ParsedPrismaQuery<TWhere extends object = Record<string, unknown>> {
  where: TWhere & Record<string, unknown>;
  orderBy: Record<string, OrderDirection>[];
  take?: number;
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function buildWhereValue(operator: string, value: unknown): unknown {
  switch (operator) {
    case 'contain':
      return { contains: value, mode: 'insensitive' };
    case 'equal':
      return value;
    case 'greater_than_equal':
      return { gte: value };
    case 'less_than_equal':
      return { lte: value };
    case 'greater_than':
      return { gt: value };
    case 'less_than':
      return { lt: value };
    default:
      throw new BadRequestException(`지원하지 않는 연산자입니다: ${operator}`);
  }
}

/**
 * '__' 구분자 기반 쿼리 DTO를 Prisma findMany 공통 인자로 변환한다.
 *
 * 지원 패턴:
 *   where__<field>__<operator>  → where 필터 (연산자 적용)
 *   where__<field>              → where 필터 (직접 동등 비교)
 *   order__<field>              → orderBy 배열
 *   take                        → 조회 개수 제한
 *
 * 지원 연산자: contain | equal | greater_than_equal | less_than_equal | greater_than | less_than
 * 필드명은 snake_case → camelCase 자동 변환된다.
 * cursor 처리는 모델별 고유키에 의존하므로 Repository에서 직접 처리한다.
 *
 * @param dto 쿼리 DTO 객체
 * @returns Prisma findMany에 바로 spread할 수 있는 공통 인자
 */
export function parseToPrismaQuery<TWhere extends object = Record<string, unknown>>(dto: object): ParsedPrismaQuery<TWhere> {
  const where: Record<string, unknown> = {};
  const orderBy: Record<string, OrderDirection>[] = [];
  let take: number | undefined;

  for (const [key, value] of Object.entries(dto)) {
    if (value === undefined || value === null) continue;

    const parts = key.split('__');
    const prefix = parts[0];

    if (prefix === 'where') {
      if (parts.length === 2) {
        where[toCamelCase(parts[1])] = value;
      } else if (parts.length === 3) {
        where[toCamelCase(parts[1])] = buildWhereValue(parts[2], value);
      }
    } else if (prefix === 'order' && parts.length === 2) {
      orderBy.push({ [toCamelCase(parts[1])]: value as OrderDirection });
    } else if (key === 'take') {
      take = value as number;
    }
  }

  return { where: where as unknown as TWhere & Record<string, unknown>, orderBy, ...(take !== undefined ? { take } : {}) };
}

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

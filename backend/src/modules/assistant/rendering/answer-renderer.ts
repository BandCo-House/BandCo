import { Injectable } from '@nestjs/common';

import type { SqlQueryRow, SqlResultMode } from '../sql/generated-sql.type';

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

@Injectable()
export class AnswerRenderer {
  /**
   * 결론 한 줄을 만든다. 행 목록은 화면의 결과 영역이 보여주므로 요약에서 다시 나열하지 않는다.
   * 모델에게 결과 문장을 다시 생성시키지 않아 조회 결과에 없는 사실이 추가되지 않는다.
   */
  render(intent: string, rows: SqlQueryRow[], resultMode?: SqlResultMode): string {
    if (rows.length === 0) {
      return `${intent}: 조건에 맞는 결과가 없어요.`;
    }

    const firstValues = Object.values(rows[0]);

    if (rows.length === 1 && firstValues.length === 1) {
      return `${intent}: ${formatValue(firstValues[0])}`;
    }

    if (rows.length === 1) {
      return `${intent}: ${firstValues.map(formatValue).join(' · ')}`;
    }

    if (resultMode === 'TOP_N') {
      return `${intent}: ${formatValue(firstValues[0])} 외 ${rows.length - 1}건`;
    }

    return `${intent} ${rows.length}${countUnit(rows[0])}`;
  }
}

/** 사람 이름만 나열한 목록은 '명', 나머지는 '건'으로 센다. */
function countUnit(row: SqlQueryRow): string {
  return Object.keys(row)[0] === 'nickname' ? '명' : '건';
}

/** Prisma raw query가 반환할 수 있는 기본 값을 JSON 안전 문자열로 만든다. */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '없음';
  }

  if (value instanceof Date) {
    return dateTimeFormatter.format(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'boolean') {
    return value ? '예' : '아니요';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  return JSON.stringify(value);
}

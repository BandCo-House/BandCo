import { Injectable } from '@nestjs/common';

import type { SqlQueryRow } from '../sql/generated-sql.type';

const MAX_ROWS_IN_SUMMARY = 5;

const COLUMN_LABELS: Record<string, string> = {
  artist_name: '아티스트',
  attendance_status: '참석 상태',
  band_member_id: '멤버 ID',
  member_count: '멤버 수',
  nickname: '닉네임',
  place_name: '장소',
  practice_count: '합주 횟수',
  role: '역할',
  skill_level: '숙련도',
  start_at: '시작 시각',
  team_name: '팀',
  title: '이름',
};

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
   * 임의 SELECT 결과를 기존 프론트의 summary 한 칸에 표시할 수 있게 만든다.
   * 모델에게 결과 문장을 다시 생성시키지 않아 조회 결과에 없는 사실이 추가되지 않는다.
   */
  render(intent: string, rows: SqlQueryRow[]): string {
    if (rows.length === 0) {
      return `${intent} 결과가 없습니다.`;
    }

    const firstEntries = Object.entries(rows[0]);

    if (rows.length === 1 && firstEntries.length === 1) {
      return `${intent}: ${formatValue(firstEntries[0][1])}`;
    }

    const previews = rows.slice(0, MAX_ROWS_IN_SUMMARY).map(formatRow).join(' / ');
    const remainder = rows.length > MAX_ROWS_IN_SUMMARY ? ` 외 ${rows.length - MAX_ROWS_IN_SUMMARY}건` : '';

    return `${intent} 결과 ${rows.length}건입니다. ${previews}${remainder}`;
  }
}

/** 결과 한 행의 컬럼과 값을 짧은 문장으로 만든다. */
function formatRow(row: SqlQueryRow): string {
  return Object.entries(row)
    .map(([key, value]) => `${COLUMN_LABELS[key] ?? key} ${formatValue(value)}`)
    .join(', ');
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

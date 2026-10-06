import { parse } from 'pgsql-parser';

import { Prisma } from '../../../generated/prisma';
import { MAX_ASSISTANT_RESULT_ROWS, type SqlQueryPage, type ValidatedSqlQuery } from '../sql/generated-sql.type';
import { SQL_CATALOG } from '../sql/sql-catalog';
import type { AssistantResultValue, AssistantTableResult } from '../types/assistant-answer.type';

type AstRecord = Record<string, unknown>;

const VALUE_LABELS: Record<string, string> = {
  PRACTICE: '합주',
  MEETING: '회의',
  PERFORMANCE: '공연',
  ONLINE: '온라인',
  PLANNED: '예정',
  DONE: '완료',
  CANCELED: '취소',
  ATTENDING: '참석',
  ABSENT: '불참',
  PENDING: '미응답',
  BM: '밴드장',
  ADMIN: '관리자',
  MEMBER: '일반 멤버',
  LEADER: '리더',
  ACTIVE: '활성',
  INACTIVE: '비활성',
  BEGINNER: '초급',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
};
/** 조건 칩과 결과 열 제목에 쓰는 짧은 이름. 카탈로그 설명은 모델용이라 화면에 그대로 쓰지 않는다. */
const FIELD_LABELS: Record<string, string> = {
  'schedules.title': '일정',
  'schedules.schedule_type': '일정 종류',
  'schedules.status': '일정 상태',
  'schedules.start_at': '시작',
  'schedules.end_at': '종료',
  'schedule_participants.attendance_status': '응답',
  'songs.title': '곡 제목',
  'songs.artist_name': '아티스트',
  'songs.bpm': 'BPM',
  'songs.key': '조성',
  'songs.difficulty_level': '난이도',
  'songs.song_length': '재생 시간(초)',
  'teams.name': '팀',
  'teams.status': '팀 상태',
  'team_members.team_role': '팀 역할',
  'band_members.role': '역할',
  'band_members.joined_at': '가입',
  'users.status': '계정 상태',
  'user_profiles.nickname': '닉네임',
  'user_skills.is_primary': '주 악기',
  'user_skills.skill_level': '숙련도',
  'skill_types.name': '악기',
  'genres.name': '장르',
  'places.name': '장소',
  'places.is_active': '사용 중',
  'band_spaces.name': '공간',
  'band_spaces.space_type': '공간 종류',
  'band_spaces.status': '공간 상태',
};
const COLUMN_LABELS: Record<string, string> = {
  member_count: '멤버 수',
  attendance_count: '참석 횟수',
  attendee_count: '참석 인원',
  participant_count: '대상 인원',
  practice_count: '연습 횟수',
  absent_count: '불참 인원',
  song_count: '곡 수',
  schedule_count: '일정 수',
  skill_name: '악기',
  team_name: '팀',
  place_name: '장소',
  title: '이름',
  nickname: '닉네임',
  start_at: '시작',
  artist_name: '아티스트',
};
const OPERATOR_TEXT: Record<string, { value: string; time: string }> = {
  '<>': { value: '제외', time: '제외' },
  '!=': { value: '제외', time: '제외' },
  '>': { value: '초과', time: '이후' },
  '>=': { value: '이상', time: '이후' },
  '<': { value: '미만', time: '이전' },
  '<=': { value: '이하', time: '까지' },
};
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
/** 생성 시각을 비교 기준으로 쓴 조건은 '지금'으로 보여준다. */
const NOW_TOLERANCE_MS = 10 * 60 * 1000;

interface ConditionChip {
  label: string;
  text: string;
  time?: { operator: string; date: Date };
}

/** 조회 결과를 같은 SQL의 컬럼·조건과 연결하고 JSON 안전 값으로 변환한다. */
export async function mapSqlResult(query: ValidatedSqlQuery, page: SqlQueryPage): Promise<AssistantTableResult> {
  const ast: unknown = await parse(query.sql);
  const aliases = new Map<string, string>();
  const selects: AstRecord[] = [];
  walk(ast, node => {
    if (isRecord(node.RangeVar)) {
      const table = node.RangeVar;
      const alias = isRecord(table.alias) ? table.alias.aliasname : table.relname;
      if (typeof alias === 'string' && typeof table.relname === 'string') aliases.set(alias, table.relname);
    }
    if (isRecord(node.SelectStmt)) selects.push(node.SelectStmt);
  });
  const columns = (selects[0]?.targetList as Array<{ ResTarget: { name?: string; val: AstRecord } }>).map(({ ResTarget: target }) => {
    const key = target.name ?? outputName(target.val);
    return {
      key,
      label: fieldLabel(target.val, aliases) ?? COLUMN_LABELS[key] ?? aliasLabel(key),
      format: page.rows.some(row => row[key] instanceof Date) ? ('datetime' as const) : ('plain' as const),
    };
  });
  if (new Set(columns.map(column => column.key)).size !== columns.length) throw new Error('같은 이름의 결과 컬럼을 구분할 수 없습니다.');
  // 제외·존재 판정 내부의 조건을 결과 행의 필수 조건으로 오인하지 않는다. 최상위 AND는 칩 하나씩으로 나눈다.
  const chips = directAndConditions(selects[0]?.whereClause).flatMap(condition => {
    const chip = formatCondition(condition, aliases, query.parameters);
    return chip ? [chip] : [];
  });
  const conditions = mergeTimeRanges(chips).map(chip => chip.text);
  return {
    entity: 'table',
    title: query.intent,
    columns,
    rows: page.rows.map(row => Object.fromEntries(columns.map(column => [column.key, serializeValue(row[column.key])]))),
    hasMore: page.hasMore,
    maxRows: MAX_ASSISTANT_RESULT_ROWS,
    resultMode: query.resultMode ?? 'LEGACY',
    conditions: [...new Set(conditions)],
  };
}

function serializeValue(value: unknown): AssistantResultValue {
  if (value === null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'bigint' || Prisma.Decimal.isDecimal(value)) return String(value);
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  throw new Error('지원하지 않는 결과 값입니다.');
}

/** 표시할 수 없는 OR 분기는 전체를 생략해 남은 분기가 필수 조건인 것처럼 보이지 않게 한다. */
function formatCondition(value: unknown, aliases: Map<string, string>, parameters: Array<string | number | boolean>): ConditionChip | null {
  if (!isRecord(value)) return null;
  if (isRecord(value.BoolExpr) && Array.isArray(value.BoolExpr.args)) {
    const expression = value.BoolExpr;
    const children = (expression.args as unknown[]).map(arg => formatCondition(arg, aliases, parameters));
    if (expression.boolop !== 'AND_EXPR' && children.some(child => child === null)) return null;
    const visible = children.filter((child): child is ConditionChip => child !== null);
    if (visible.length === 0) return null;
    if (visible.length === 1 && expression.boolop !== 'NOT_EXPR') return visible[0];
    if (expression.boolop === 'NOT_EXPR') return { label: '', text: `${visible.map(chip => chip.text).join(', ')} 제외` };
    const joiner = expression.boolop === 'OR_EXPR' ? ' 또는 ' : ', ';
    const label = visible[0].label;
    // 같은 항목의 선택지는 '응답: 없음 또는 미응답'처럼 이름을 한 번만 쓴다.
    if (label && visible.every(chip => chip.label === label)) {
      return { label, text: `${label}: ${visible.map(chip => chip.text.slice(label.length + 2)).join(joiner)}` };
    }
    return { label: '', text: visible.map(chip => chip.text).join(joiner) };
  }
  if (isRecord(value.NullTest)) {
    const label = fieldLabel(value.NullTest.arg, aliases);
    if (!label || isHiddenColumn(value.NullTest.arg)) return null;
    return { label, text: `${label}: ${value.NullTest.nulltesttype === 'IS_NULL' ? '없음' : '있음'}` };
  }
  if (isRecord(value.A_Expr)) {
    const expression = value.A_Expr;
    const label = fieldLabel(expression.lexpr, aliases);
    if (!label || isHiddenColumn(expression.lexpr)) return null;
    const parameter = readValue(expression.rexpr, parameters);
    if (parameter === undefined) return null;
    const operator = names(expression.name)[0];
    const date = typeof parameter === 'string' ? parseTimestamp(parameter) : null;
    const display = date
      ? formatDate(date)
      : typeof parameter === 'boolean'
        ? parameter
          ? '예'
          : '아니요'
        : (VALUE_LABELS[String(parameter)] ?? String(parameter));
    if (operator === '=') return { label, text: `${label}: ${display}` };
    if (operator === '~~*' || operator === '~~') return { label, text: `${label}: '${display.replace(/%/g, '')}' 포함` };
    const phrase = OPERATOR_TEXT[operator];
    if (!phrase) return null;
    return { label, text: `${label}: ${display} ${date ? phrase.time : phrase.value}`, ...(date ? { time: { operator, date } } : {}) };
  }
  return null;
}

/** 같은 항목의 시작·끝 조건을 '8월 1일 ~ 8월 31일' 하나로 합친다. */
function mergeTimeRanges(chips: ConditionChip[]): ConditionChip[] {
  const merged: ConditionChip[] = [];
  const used = new Set<ConditionChip>();
  for (const chip of chips) {
    if (used.has(chip)) continue;
    const isStart = chip.time && (chip.time.operator === '>=' || chip.time.operator === '>');
    const end = isStart
      ? chips.find(
          other =>
            other !== chip && !used.has(other) && other.label === chip.label && (other.time?.operator === '<' || other.time?.operator === '<='),
        )
      : undefined;
    if (chip.time && end?.time) {
      used.add(end);
      // 끝이 '다음 날 0시 미만'이면 사람이 읽는 마지막 날은 그 전날이다.
      const last =
        end.time.operator === '<' && isKstMidnight(end.time.date) ? new Date(end.time.date.getTime() - 24 * 60 * 60 * 1000) : end.time.date;
      merged.push({ label: chip.label, text: `${chip.label}: ${formatDate(chip.time.date)} ~ ${formatDate(last)}` });
      continue;
    }
    merged.push(chip);
  }
  return merged;
}

function directAndConditions(value: unknown): unknown[] {
  if (!isRecord(value)) return [];
  if (isRecord(value.BoolExpr) && value.BoolExpr.boolop === 'AND_EXPR' && Array.isArray(value.BoolExpr.args)) {
    return value.BoolExpr.args.flatMap(directAndConditions);
  }
  return [value];
}

function parseTimestamp(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function isKstMidnight(date: Date): boolean {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return kst.getUTCHours() === 0 && kst.getUTCMinutes() === 0;
}

/** 한국 시간으로 읽는다. 0시는 날짜만, 올해가 아니면 연도를 붙인다. */
function formatDate(date: Date): string {
  if (Math.abs(date.getTime() - Date.now()) < NOW_TOLERANCE_MS) return '지금';
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const thisYear = new Date(Date.now() + KST_OFFSET_MS).getUTCFullYear();
  const day = `${kst.getUTCFullYear() === thisYear ? '' : `${kst.getUTCFullYear()}년 `}${kst.getUTCMonth() + 1}월 ${kst.getUTCDate()}일`;
  if (isKstMidnight(date)) return day;
  return `${day} ${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`;
}

/** 별칭에서 뜻을 짐작할 수 없으면 영문 별칭 대신 일반적인 이름을 쓴다. */
function aliasLabel(key: string): string {
  if (/member|attendee|participant|person|people/.test(key) && /count/.test(key)) return '인원';
  if (/count/.test(key)) return '개수';
  if (/avg|average/.test(key)) return '평균';
  if (/sum|total/.test(key)) return '합계';
  return /^[a-z0-9_?]+$/.test(key) ? '값' : key;
}

function readValue(value: unknown, parameters: Array<string | number | boolean>): string | number | boolean | undefined {
  if (!isRecord(value)) return undefined;
  if (isRecord(value.TypeCast)) return readValue(value.TypeCast.arg, parameters);
  if (isRecord(value.ParamRef) && typeof value.ParamRef.number === 'number' && value.ParamRef.number > 1)
    return parameters[value.ParamRef.number - 2];
  if (isRecord(value.A_Const)) {
    for (const key of ['sval', 'ival', 'boolval']) {
      const nested = value.A_Const[key];
      if (isRecord(nested)) {
        const raw = nested[key];
        if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') return raw;
      }
    }
  }
  return undefined;
}

function fieldLabel(value: unknown, aliases: Map<string, string>): string | undefined {
  if (!isRecord(value)) return undefined;
  if (isRecord(value.TypeCast)) return fieldLabel(value.TypeCast.arg, aliases);
  if (!isRecord(value.ColumnRef)) return undefined;
  const [alias, column] = names(value.ColumnRef.fields);
  const table = aliases.get(alias);
  if (!table) return undefined;
  const description = SQL_CATALOG[table]?.columns[column];
  return FIELD_LABELS[`${table}.${column}`] ?? (description && description.length <= 8 && !/[,·]|또는/.test(description) ? description : undefined);
}

function isHiddenColumn(value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (isRecord(value.TypeCast)) return isHiddenColumn(value.TypeCast.arg);
  return isRecord(value.ColumnRef) && ['id', 'band_id', 'deleted_at'].includes(names(value.ColumnRef.fields).at(-1) ?? '');
}

function outputName(value: AstRecord): string {
  if (isRecord(value.TypeCast) && isRecord(value.TypeCast.arg)) return outputName(value.TypeCast.arg);
  if (isRecord(value.ColumnRef)) return names(value.ColumnRef.fields).at(-1) ?? '?column?';
  if (isRecord(value.FuncCall)) return names(value.FuncCall.funcname).at(-1) ?? '?column?';
  return '?column?';
}

function names(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => (isRecord(item) && isRecord(item.String) && typeof item.String.sval === 'string' ? [item.String.sval] : []));
}

function walk(value: unknown, visit: (node: AstRecord) => void): void {
  if (Array.isArray(value)) value.forEach(item => walk(item, visit));
  else if (isRecord(value)) {
    visit(value);
    Object.values(value).forEach(item => walk(item, visit));
  }
}

function isRecord(value: unknown): value is AstRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

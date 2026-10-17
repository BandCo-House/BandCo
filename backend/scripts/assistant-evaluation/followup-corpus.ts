import type { RawSqlParameter, SqlResultMode } from '../../src/modules/assistant/sql/generated-sql.type';

import { FIXED_NOW, NATURAL_QUERY_CASES, type NaturalQueryCase } from './corpus';

/**
 * 후속 질문 평가 문항이다. 직전 턴은 정답 SQL로 고정해, 첫 질문의 정답 여부와 상관없이
 * "그중에"·"그 사람들"·"8월은?" 같은 지시어를 직전 조건으로 해석하는지만 본다.
 * 직전 SQL은 서버가 다시 검증하므로 실행 SQL과 같은 규칙(문자열은 파라미터, 밴드 범위 등)을 지킨다.
 */
export interface FollowUpQueryCase extends NaturalQueryCase {
  previous: {
    question: string;
    intent: string;
    sql: string;
    params: RawSqlParameter[];
    resultMode: SqlResultMode;
  };
}

const NOW = FIXED_NOW.toISOString();
const AUGUST = ['2026-08-01T00:00:00+09:00', '2026-09-01T00:00:00+09:00'];
const SEPTEMBER = ['2026-09-01T00:00:00+09:00', '2026-10-01T00:00:00+09:00'];
const text = (position: number, value: string): RawSqlParameter => ({ position, type: 'TEXT', value });
const time = (position: number, value: string): RawSqlParameter => ({ position, type: 'TIMESTAMPTZ', value });

// 직전 SQL용. 다음 합주 일정 하나를 고르고 참여 행과 멤버 프로필을 잇는다. $2=현재 시각, $3=PRACTICE, $4=PLANNED
const PREV_NEXT_PRACTICE =
  '(SELECT sc2.id FROM band_spaces bs2 JOIN schedules sc2 ON sc2.band_space_id = bs2.id WHERE bs2.band_id = b.id AND bs2.deleted_at IS NULL AND sc2.schedule_type::text = $3 AND sc2.status::text = $4 AND sc2.start_at >= $2::timestamptz ORDER BY sc2.start_at ASC LIMIT 1)';
const PREV_PARTICIPANT_PROFILES = `FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_participants sp ON sp.schedule_id = sc.id JOIN band_members bm ON bm.id = sp.band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND u.deleted_at IS NULL AND sc.id = ${PREV_NEXT_PRACTICE}`;
const NEXT_PRACTICE_PARAMS = [time(2, NOW), text(3, 'PRACTICE'), text(4, 'PLANNED')];

// 정답 SQL용. 평가기는 정답 SQL을 그대로 실행하므로 문자열을 직접 쓴다.
const GOLD_NEXT_PRACTICE =
  "(SELECT sc2.id FROM band_spaces bs2 JOIN schedules sc2 ON sc2.band_space_id = bs2.id WHERE bs2.band_id = b.id AND bs2.deleted_at IS NULL AND sc2.schedule_type = 'PRACTICE' AND sc2.status = 'PLANNED' AND sc2.start_at >= $2::timestamptz ORDER BY sc2.start_at ASC LIMIT 1)";
const GOLD_PARTICIPANT_PROFILES = `FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_participants sp ON sp.schedule_id = sc.id JOIN band_members bm ON bm.id = sp.band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND u.deleted_at IS NULL AND sc.id = ${GOLD_NEXT_PRACTICE}`;
const SCHEDULES =
  'FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL';
const SEPTEMBER_SONGS =
  'FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_song ss ON ss.schedule_id = sc.id JOIN songs so ON so.id = ss.song_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND so.band_id = b.id AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz';

const MEMBER_COUNT = NATURAL_QUERY_CASES.find(queryCase => queryCase.id === 'M01');
if (!MEMBER_COUNT) throw new Error('대조 문항에 쓰는 M01이 없습니다.');

export const FOLLOWUP_QUERY_CASES: FollowUpQueryCase[] = [
  {
    id: 'F01',
    category: '조건 이어받기',
    previous: {
      question: '다음 합주에 참석한다고 한 사람은 누구야?',
      intent: '다음 합주 참석자 명단',
      sql: `SELECT DISTINCT up.nickname ${PREV_PARTICIPANT_PROFILES} AND sp.attendance_status::text = $5`,
      params: [...NEXT_PRACTICE_PARAMS, text(5, 'ATTENDING')],
      resultMode: 'LIST',
    },
    question: '그중에 주 악기가 기타인 사람은 몇 명이야?',
    columns: [{ key: 'person_count', type: 'decimal' }],
    goldSql: `SELECT COUNT(DISTINCT sp.band_member_id)::int AS person_count ${GOLD_PARTICIPANT_PROFILES.replace(
      'WHERE',
      'JOIN user_skills us ON us.user_id = u.id JOIN skill_types st ON st.id = us.skill_type_id WHERE',
    )} AND sp.attendance_status = 'ATTENDING' AND us.is_primary = true AND st.name = '기타'`,
    goldParameters: [NOW],
  },
  {
    id: 'F02',
    category: '조건 이어받기',
    previous: {
      question: '8월 합주 일정 보여줘',
      intent: '8월 합주 일정 목록',
      sql: `SELECT sc.title, sc.start_at ${SCHEDULES} AND sc.schedule_type::text = $2 AND sc.start_at >= $3::timestamptz AND sc.start_at < $4::timestamptz ORDER BY sc.start_at ASC`,
      params: [text(2, 'PRACTICE'), time(3, AUGUST[0]), time(4, AUGUST[1])],
      resultMode: 'LIST',
    },
    question: '그중에 취소된 건 몇 개야?',
    columns: [{ key: 'canceled_count', type: 'decimal' }],
    goldSql: `SELECT COUNT(sc.id)::int AS canceled_count ${SCHEDULES} AND sc.schedule_type = 'PRACTICE' AND sc.status = 'CANCELED' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz`,
    goldParameters: AUGUST,
  },
  {
    id: 'F03',
    category: '조건 이어받기',
    previous: {
      question: '9월에 편성된 곡 목록 보여줘',
      intent: '9월 일정에 편성된 곡 목록',
      sql: `SELECT DISTINCT so.title ${SEPTEMBER_SONGS}`,
      params: [time(2, SEPTEMBER[0]), time(3, SEPTEMBER[1])],
      resultMode: 'LIST',
    },
    question: '그중에 BPM이 120 이상인 곡은?',
    columns: [{ key: 'title', type: 'text' }],
    goldSql: `SELECT DISTINCT so.title ${SEPTEMBER_SONGS} AND so.bpm >= 120`,
    goldParameters: SEPTEMBER,
  },
  {
    id: 'F04',
    category: '조건 이어받기',
    previous: {
      question: '다음 합주에 아직 응답 안 한 사람은 누구야?',
      intent: '다음 합주 미응답자 명단',
      sql: `SELECT DISTINCT up.nickname ${PREV_PARTICIPANT_PROFILES} AND (sp.attendance_status::text = $5 OR sp.attendance_status IS NULL)`,
      params: [...NEXT_PRACTICE_PARAMS, text(5, 'PENDING')],
      resultMode: 'LIST',
    },
    question: '그 사람들 닉네임을 가나다순으로 보여줘.',
    orderSensitive: true,
    columns: [{ key: 'nickname', type: 'text' }],
    goldSql: `SELECT DISTINCT up.nickname ${GOLD_PARTICIPANT_PROFILES} AND (sp.attendance_status = 'PENDING' OR sp.attendance_status IS NULL) ORDER BY up.nickname ASC`,
    goldParameters: [NOW],
  },
  {
    id: 'F05',
    category: '대상 이어받기',
    previous: {
      question: '다음 합주에 참석하는 사람은 몇 명이야?',
      intent: '다음 합주 참석 인원',
      sql: `SELECT COUNT(DISTINCT sp.band_member_id)::int AS attendee_count ${PREV_PARTICIPANT_PROFILES} AND sp.attendance_status::text = $5`,
      params: [...NEXT_PRACTICE_PARAMS, text(5, 'ATTENDING')],
      resultMode: 'AGGREGATE',
    },
    question: '불참한다고 한 사람은 누구야?',
    columns: [{ key: 'nickname', type: 'text' }],
    goldSql: `SELECT DISTINCT up.nickname ${GOLD_PARTICIPANT_PROFILES} AND sp.attendance_status = 'ABSENT'`,
    goldParameters: [NOW],
  },
  {
    id: 'F06',
    category: '대상 이어받기',
    previous: {
      question: '9월에 합주가 몇 번 잡혀 있어?',
      intent: '9월 합주 횟수',
      sql: `SELECT COUNT(sc.id)::int AS practice_count ${SCHEDULES} AND sc.schedule_type::text = $2 AND sc.status::text <> $3 AND sc.start_at >= $4::timestamptz AND sc.start_at < $5::timestamptz`,
      params: [text(2, 'PRACTICE'), text(3, 'CANCELED'), time(4, SEPTEMBER[0]), time(5, SEPTEMBER[1])],
      resultMode: 'AGGREGATE',
    },
    question: '8월은?',
    columns: [{ key: 'practice_count', type: 'decimal' }],
    goldSql: `SELECT COUNT(sc.id)::int AS practice_count ${SCHEDULES} AND sc.schedule_type = 'PRACTICE' AND sc.status <> 'CANCELED' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz`,
    goldParameters: AUGUST,
  },
  {
    id: 'F07',
    category: '대조(이력 무시)',
    previous: {
      question: '8월 합주 일정 보여줘',
      intent: '8월 합주 일정 목록',
      sql: `SELECT sc.title, sc.start_at ${SCHEDULES} AND sc.schedule_type::text = $2 AND sc.start_at >= $3::timestamptz AND sc.start_at < $4::timestamptz ORDER BY sc.start_at ASC`,
      params: [text(2, 'PRACTICE'), time(3, AUGUST[0]), time(4, AUGUST[1])],
      resultMode: 'LIST',
    },
    question: MEMBER_COUNT.question,
    columns: MEMBER_COUNT.columns,
    goldSql: MEMBER_COUNT.goldSql,
    goldParameters: MEMBER_COUNT.goldParameters,
  },
];

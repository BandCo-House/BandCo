import type { RawGeneratedSql, RawSqlParameter } from '../sql/generated-sql.type';

export interface AssistantPreset {
  id: string;
  /** 홈의 가로 칩에 보여줄 짧은 이름 */
  label: string;
  question: string;
  /**
   * 이 추천 질문의 답 뒤에 보여줄 이어서 물어보기. 자유 질문으로 모델에 보낸다.
   * 합성 평가 DB에서 실제 모델로 답이 맞는지 확인한 질문만 둔다.
   */
  followUps: string[];
  /** 모델 대신 서버가 정한 SELECT. 자유 질문과 같은 검증기를 통과해야 실행된다. */
  createQuery(now: Date): RawGeneratedSql;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const NEXT_PRACTICE_ID =
  '(SELECT sc2.id FROM band_spaces bs2 JOIN schedules sc2 ON sc2.band_space_id = bs2.id WHERE bs2.band_id = b.id AND bs2.deleted_at IS NULL AND sc2.schedule_type::text = $2 AND sc2.status::text = $3 AND sc2.start_at >= $4::timestamptz ORDER BY sc2.start_at ASC LIMIT 1)';

/**
 * 추천 질문은 가장 많이 눌리는 질문이라 답의 형태가 매번 같아야 한다.
 * 모델 생성 SQL은 같은 질문에도 고르는 컬럼이 달라질 수 있어(예: 일정 이름 누락) 고정 SQL로 실행한다.
 */
export const ASSISTANT_PRESETS: AssistantPreset[] = [
  {
    id: 'next-schedule',
    label: '다음 합주',
    question: '다음 합주 일정이 언제야?',
    followUps: ['다음 합주에 참석하는 사람은 몇 명이야?', '다음 합주에서 연습할 곡은 뭐야?', '다음 합주에 아직 응답 안 한 사람은 누구야?'],
    createQuery: now => ({
      status: 'QUERY',
      intent: '다음 합주',
      resultMode: 'TOP_N',
      unsupportedReason: null,
      sql: 'SELECT sc.title, sc.start_at, p.name AS place_name FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id LEFT JOIN places p ON p.id = sc.place_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type::text = $2 AND sc.status::text = $3 AND sc.start_at >= $4::timestamptz ORDER BY sc.start_at ASC LIMIT 1',
      params: nextPracticeParams(now),
    }),
  },
  {
    id: 'pending-attendance',
    label: '미응답자',
    question: '아직 참석 여부를 응답하지 않은 사람은?',
    followUps: ['다음 합주에 참석한다고 답한 사람은 누구야?', '다음 합주에 불참한다고 답한 사람은 몇 명이야?', '다음 합주는 어디서 해?'],
    createQuery: now => ({
      status: 'QUERY',
      intent: '다음 합주 미응답자',
      resultMode: 'LIST',
      unsupportedReason: null,
      sql: `SELECT up.nickname FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_participants sp ON sp.schedule_id = sc.id JOIN band_members bm ON bm.id = sp.band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND u.deleted_at IS NULL AND sc.id = ${NEXT_PRACTICE_ID} AND (sp.attendance_status IS NULL OR sp.attendance_status::text = $5) ORDER BY up.nickname ASC`,
      params: [...nextPracticeParams(now), text(5, 'PENDING')],
    }),
  },
  {
    id: 'most-practiced-song-this-month',
    label: '이번 달 연습곡',
    question: '이번 달 가장 많이 연습한 곡은?',
    followUps: ['이번 달 합주에서 연습한 곡은 모두 몇 곡이야?', '지난달 가장 많이 연습한 곡 3개는 뭐야?', '다음 합주에서 연습할 곡은 뭐야?'],
    createQuery: now => {
      const [monthStart, nextMonthStart] = kstMonthRange(now);
      return {
        status: 'QUERY',
        intent: '이번 달 많이 연습한 곡',
        resultMode: 'TOP_N',
        unsupportedReason: null,
        sql: 'SELECT so.title, so.artist_name, COUNT(sso.id)::int AS practice_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_song sso ON sso.schedule_id = sc.id JOIN songs so ON so.id = sso.song_id AND so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type::text = $2 AND sc.status::text <> $3 AND sc.start_at >= $4::timestamptz AND sc.start_at < $5::timestamptz GROUP BY so.id, so.title, so.artist_name ORDER BY practice_count DESC, so.title ASC LIMIT 3',
        params: [text(2, 'PRACTICE'), text(3, 'CANCELED'), timestamp(4, monthStart), timestamp(5, nextMonthStart)],
      };
    },
  },
  {
    id: 'most-active-member-3months',
    label: '참여 많은 멤버',
    question: '최근 3개월 동안 합주에 가장 많이 참여한 멤버는?',
    followUps: ['최근 3개월 동안 합주는 몇 번 했어?', '이번 달 합주에 가장 많이 참석한 멤버 3명은?', '다음 합주에 참석한다고 답한 사람은 누구야?'],
    createQuery: now => {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3);
      return {
        status: 'QUERY',
        intent: '최근 3개월 합주 참여가 많은 멤버',
        resultMode: 'TOP_N',
        unsupportedReason: null,
        sql: 'SELECT up.nickname, COUNT(DISTINCT sp.schedule_id)::int AS attendance_count FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id JOIN schedule_participants sp ON sp.band_member_id = bm.id JOIN schedules sc ON sc.id = sp.schedule_id JOIN band_spaces bs ON bs.id = sc.band_space_id AND bs.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type::text = $2 AND sc.status::text = $3 AND sp.attendance_status::text = $4 AND sc.start_at >= $5::timestamptz AND sc.start_at < $6::timestamptz GROUP BY bm.id, up.nickname ORDER BY attendance_count DESC, up.nickname ASC LIMIT 3',
        params: [text(2, 'PRACTICE'), text(3, 'DONE'), text(4, 'ATTENDING'), timestamp(5, threeMonthsAgo), timestamp(6, now)],
      };
    },
  },
];

/** ID와 일치하는 추천 질문을 찾는다. */
export function findPresetById(presetId: string): AssistantPreset | undefined {
  return ASSISTANT_PRESETS.find(preset => preset.id === presetId);
}

function nextPracticeParams(now: Date): RawSqlParameter[] {
  return [text(2, 'PRACTICE'), text(3, 'PLANNED'), timestamp(4, now)];
}

/** 한국 시간 기준 이번 달 1일 0시와 다음 달 1일 0시 */
function kstMonthRange(now: Date): [Date, Date] {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const start = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), 1) - KST_OFFSET_MS;
  const end = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth() + 1, 1) - KST_OFFSET_MS;
  return [new Date(start), new Date(end)];
}

function text(position: number, value: string): RawSqlParameter {
  return { position, type: 'TEXT', value };
}

function timestamp(position: number, value: Date): RawSqlParameter {
  return { position, type: 'TIMESTAMPTZ', value: value.toISOString() };
}

import type { EvaluationContract } from './evaluate-rows';

export interface NaturalQueryCase extends EvaluationContract {
  id: string;
  category: string;
  question: string;
  goldSql: string;
  goldParameters: Array<string | number | boolean>;
}

export const TARGET_BAND_ID = '11111111-1111-4111-8111-111111111111';
export const FIXED_NOW = new Date('2026-09-01T00:00:00.000Z');

export const NATURAL_QUERY_CASES: NaturalQueryCase[] = [
  {
    id: 'M01',
    columns: [{ key: 'member_count', type: 'decimal' }],
    category: '멤버·프로필',
    question: '우리 밴드 멤버는 모두 몇 명이야?',
    goldSql:
      'SELECT COUNT(bm.id)::int AS member_count FROM bands b JOIN band_members bm ON bm.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL',
    goldParameters: [],
  },
  {
    id: 'M02',
    orderSensitive: true,
    columns: [{ key: 'nickname', type: 'text' }],
    category: '멤버·프로필',
    question: '관리자 역할인 멤버의 닉네임만 가나다순으로 알려줘.',
    goldSql:
      "SELECT up.nickname FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND bm.role = 'ADMIN' ORDER BY up.nickname ASC",
    goldParameters: [],
  },
  {
    id: 'M03',
    orderSensitive: true,
    columns: [{ key: 'nickname', type: 'text' }],
    category: '멤버·프로필',
    question: '일반 멤버 역할인 사람들의 닉네임만 가나다순으로 보여줘.',
    goldSql:
      "SELECT up.nickname FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND bm.role = 'MEMBER' ORDER BY up.nickname ASC",
    goldParameters: [],
  },
  {
    id: 'M04',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '멤버·프로필',
    question: '가장 먼저 가입한 멤버 5명의 닉네임만 가입 순서대로 알려줘.',
    goldSql:
      'SELECT up.nickname FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL ORDER BY bm.joined_at ASC LIMIT 5',
    goldParameters: [],
    orderSensitive: true,
  },
  {
    id: 'M05',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '멤버·프로필',
    question: '가장 최근에 가입한 멤버 한 명의 닉네임만 알려줘.',
    goldSql:
      'SELECT up.nickname FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL ORDER BY bm.joined_at DESC LIMIT 1',
    goldParameters: [],
  },
  {
    id: 'M06',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '멤버·프로필',
    question: "닉네임에 '민'이 들어가는 멤버의 닉네임만 알려줘.",
    goldSql:
      'SELECT up.nickname FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND up.nickname ILIKE $2 ORDER BY up.nickname ASC',
    goldParameters: ['%민%'],
  },
  {
    id: 'M07',
    columns: [{ key: 'active_member_count', type: 'decimal' }],
    category: '멤버·프로필',
    question: '활성 상태인 밴드 멤버는 몇 명이야?',
    goldSql:
      "SELECT COUNT(bm.id)::int AS active_member_count FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND u.status = 'ACTIVE'",
    goldParameters: [],
  },
  {
    id: 'M08',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '멤버·프로필',
    question: '자기소개를 아직 작성하지 않은 멤버의 닉네임만 알려줘.',
    goldSql:
      'SELECT up.nickname FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND up.self_description IS NULL ORDER BY up.nickname ASC',
    goldParameters: [],
  },
  {
    id: 'S01',
    columns: [
      { key: 'title', type: 'text' },
      { key: 'start_at', type: 'timestamp' },
    ],
    category: '일정·참석',
    question: '다음 합주의 이름과 시작 시간은 언제야?',
    goldSql:
      "SELECT sc.title, sc.start_at FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type = 'PRACTICE' AND sc.status = 'PLANNED' AND sc.start_at >= $2::timestamptz ORDER BY sc.start_at ASC LIMIT 1",
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'S02',
    columns: [
      { key: 'title', type: 'text' },
      { key: 'start_at', type: 'timestamp' },
    ],
    category: '일정·참석',
    question: '다음 회의의 이름과 시작 시간만 알려줘.',
    goldSql:
      "SELECT sc.title, sc.start_at FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type = 'MEETING' AND sc.status = 'PLANNED' AND sc.start_at >= $2::timestamptz ORDER BY sc.start_at ASC LIMIT 1",
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'S03',
    columns: [
      { key: 'title', type: 'text' },
      { key: 'start_at', type: 'timestamp' },
    ],
    category: '일정·참석',
    question: '종류와 상관없이 가장 가까운 예정 일정의 이름과 시작 시간은?',
    goldSql:
      "SELECT sc.title, sc.start_at FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.status = 'PLANNED' AND sc.start_at >= $2::timestamptz ORDER BY sc.start_at ASC LIMIT 1",
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'S04',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '일정·참석',
    question: '다음 합주에 아직 응답하지 않은 사람의 닉네임만 알려줘.',
    goldSql:
      "SELECT DISTINCT up.nickname FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_participants sp ON sp.schedule_id = sc.id JOIN band_members bm ON bm.id = sp.band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND u.deleted_at IS NULL AND sc.id = (SELECT sc2.id FROM band_spaces bs2 JOIN schedules sc2 ON sc2.band_space_id = bs2.id WHERE bs2.band_id = b.id AND bs2.deleted_at IS NULL AND sc2.schedule_type = 'PRACTICE' AND sc2.status = 'PLANNED' AND sc2.start_at >= $2::timestamptz ORDER BY sc2.start_at ASC LIMIT 1) AND (sp.attendance_status IS NULL OR sp.attendance_status = 'PENDING') ORDER BY up.nickname ASC",
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'S05',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '일정·참석',
    question: '다음 합주에 참석한다고 답한 사람의 닉네임만 알려줘.',
    goldSql:
      "SELECT DISTINCT up.nickname FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_participants sp ON sp.schedule_id = sc.id JOIN band_members bm ON bm.id = sp.band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND u.deleted_at IS NULL AND sc.id = (SELECT sc2.id FROM band_spaces bs2 JOIN schedules sc2 ON sc2.band_space_id = bs2.id WHERE bs2.band_id = b.id AND bs2.deleted_at IS NULL AND sc2.schedule_type = 'PRACTICE' AND sc2.status = 'PLANNED' AND sc2.start_at >= $2::timestamptz ORDER BY sc2.start_at ASC LIMIT 1) AND sp.attendance_status = 'ATTENDING' ORDER BY up.nickname ASC",
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'S06',
    columns: [{ key: 'absent_count', type: 'decimal' }],
    category: '일정·참석',
    question: '다음 합주에 불참한다고 답한 사람은 몇 명이야?',
    goldSql:
      "SELECT COUNT(DISTINCT sp.band_member_id)::int AS absent_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_participants sp ON sp.schedule_id = sc.id JOIN band_members bm ON bm.id = sp.band_member_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.id = (SELECT sc2.id FROM band_spaces bs2 JOIN schedules sc2 ON sc2.band_space_id = bs2.id WHERE bs2.band_id = b.id AND bs2.deleted_at IS NULL AND sc2.schedule_type = 'PRACTICE' AND sc2.status = 'PLANNED' AND sc2.start_at >= $2::timestamptz ORDER BY sc2.start_at ASC LIMIT 1) AND sp.attendance_status = 'ABSENT'",
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'S07',
    columns: [{ key: 'practice_count', type: 'decimal' }],
    category: '일정·참석',
    question: '2026년 9월 합주는 취소된 것을 제외하면 몇 번이야?',
    goldSql:
      "SELECT COUNT(sc.id)::int AS practice_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type = 'PRACTICE' AND sc.status <> 'CANCELED' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz",
    goldParameters: ['2026-08-31T15:00:00.000Z', '2026-09-30T15:00:00.000Z'],
  },
  {
    id: 'S08',
    columns: [{ key: 'done_count', type: 'decimal' }],
    category: '일정·참석',
    question: '2026년 8월에 완료된 일정은 몇 개야?',
    goldSql:
      "SELECT COUNT(sc.id)::int AS done_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.status = 'DONE' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz",
    goldParameters: ['2026-07-31T15:00:00.000Z', '2026-08-31T15:00:00.000Z'],
  },
  {
    id: 'S09',
    columns: [{ key: 'title', type: 'text' }],
    category: '일정·참석',
    question: '취소된 일정의 이름만 시간순으로 보여줘.',
    goldSql:
      "SELECT sc.title FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.status = 'CANCELED' ORDER BY sc.start_at ASC LIMIT 50",
    goldParameters: [],
    orderSensitive: true,
  },
  {
    id: 'S10',
    columns: [{ key: 'title', type: 'text' }],
    category: '일정·참석',
    question: '강남 합주실에서 열리는 일정의 이름만 시간순으로 알려줘.',
    goldSql:
      'SELECT sc.title FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN places p ON p.id = sc.place_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND p.name = $2 ORDER BY sc.start_at ASC LIMIT 50',
    goldParameters: ['강남 합주실'],
    orderSensitive: true,
  },
  {
    id: 'S11',
    columns: [{ key: 'title', type: 'text' }],
    category: '일정·참석',
    question: '2026년 9월 1일부터 7일까지 일정 이름만 시간순으로 보여줘.',
    goldSql:
      'SELECT sc.title FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz ORDER BY sc.start_at ASC',
    goldParameters: ['2026-08-31T15:00:00.000Z', '2026-09-07T15:00:00.000Z'],
    orderSensitive: true,
  },
  {
    id: 'S12',
    columns: [
      { key: 'schedule_type', type: 'text' },
      { key: 'schedule_count', type: 'decimal' },
    ],
    category: '일정·참석',
    question: '2026년 9월 일정 수를 합주와 회의 종류별로 보여줘.',
    goldSql:
      "SELECT sc.schedule_type::text AS schedule_type, COUNT(sc.id)::int AS schedule_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.status <> 'CANCELED' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz GROUP BY sc.schedule_type ORDER BY sc.schedule_type ASC",
    goldParameters: ['2026-08-31T15:00:00.000Z', '2026-09-30T15:00:00.000Z'],
  },
  {
    id: 'S13',
    tiePolicy: 'one',
    columns: [
      { key: 'nickname', type: 'text' },
      { key: 'attendance_count', type: 'decimal' },
    ],
    category: '일정·참석',
    question: '참석으로 응답한 횟수가 가장 많은 멤버 한 명의 닉네임과 횟수를 알려줘.',
    goldSql:
      "SELECT up.nickname, COUNT(DISTINCT sp.schedule_id)::int AS attendance_count FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id JOIN schedule_participants sp ON sp.band_member_id = bm.id JOIN schedules sc ON sc.id = sp.schedule_id JOIN band_spaces bs ON bs.id = sc.band_space_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.status <> 'CANCELED' AND sp.attendance_status = 'ATTENDING' GROUP BY bm.id, up.nickname ORDER BY attendance_count DESC FETCH FIRST 1 ROW WITH TIES",
    goldParameters: [],
  },
  {
    id: 'S14',
    columns: [{ key: 'schedule_count', type: 'decimal' }],
    category: '일정·참석',
    question: '앞으로 7일 동안 예정된 일정은 몇 개야?',
    goldSql:
      "SELECT COUNT(sc.id)::int AS schedule_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.status = 'PLANNED' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz",
    goldParameters: [FIXED_NOW.toISOString(), '2026-09-08T00:00:00.000Z'],
  },
  {
    id: 'S15',
    columns: [{ key: 'participant_count', type: 'decimal' }],
    category: '일정·참석',
    question: '다음 합주의 참석 대상자는 모두 몇 명이야?',
    goldSql:
      "SELECT COUNT(DISTINCT sp.band_member_id)::int AS participant_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_participants sp ON sp.schedule_id = sc.id JOIN band_members bm ON bm.id = sp.band_member_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.id = (SELECT sc2.id FROM band_spaces bs2 JOIN schedules sc2 ON sc2.band_space_id = bs2.id WHERE bs2.band_id = b.id AND bs2.deleted_at IS NULL AND sc2.schedule_type = 'PRACTICE' AND sc2.status = 'PLANNED' AND sc2.start_at >= $2::timestamptz ORDER BY sc2.start_at ASC LIMIT 1)",
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'G01',
    columns: [{ key: 'song_count', type: 'decimal' }],
    category: '곡·연습 통계',
    question: '우리 밴드에 등록된 곡은 모두 몇 개야?',
    goldSql: 'SELECT COUNT(so.id)::int AS song_count FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL',
    goldParameters: [],
  },
  {
    id: 'G02',
    columns: [{ key: 'title', type: 'text' }],
    category: '곡·연습 통계',
    question: 'BPM이 150 이상인 곡의 이름만 BPM 높은 순서로 알려줘.',
    goldSql:
      'SELECT so.title FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND so.bpm >= $2::int ORDER BY so.bpm DESC LIMIT 50',
    goldParameters: [150],
    orderSensitive: true,
  },
  {
    id: 'G03',
    columns: [{ key: 'title', type: 'text' }],
    category: '곡·연습 통계',
    question: '조성이 C인 곡의 이름만 알려줘.',
    goldSql:
      "SELECT so.title FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND so.key = 'C' ORDER BY so.title ASC",
    goldParameters: [],
  },
  {
    id: 'G04',
    columns: [{ key: 'title', type: 'text' }],
    category: '곡·연습 통계',
    question: '난이도가 2 이하인 곡의 이름만 알려줘.',
    goldSql:
      'SELECT so.title FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND so.difficulty_level <= $2::int ORDER BY so.title ASC',
    goldParameters: [2],
  },
  {
    id: 'G05',
    columns: [
      { key: 'title', type: 'text' },
      { key: 'song_length', type: 'decimal' },
    ],
    category: '곡·연습 통계',
    question: '재생 시간이 가장 긴 곡 한 개의 이름과 재생 시간을 알려줘.',
    goldSql:
      'SELECT so.title, so.song_length FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL ORDER BY so.song_length DESC LIMIT 1',
    goldParameters: [],
  },
  {
    id: 'G06',
    tiePolicy: 'one-or-all',
    columns: [
      { key: 'title', type: 'text' },
      { key: 'practice_count', type: 'decimal' },
    ],
    category: '곡·연습 통계',
    question: '2026년 8월 합주에서 가장 많이 연습한 곡의 이름과 횟수는?',
    goldSql:
      "SELECT so.title, COUNT(sso.id)::int AS practice_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_song sso ON sso.schedule_id = sc.id JOIN songs so ON so.id = sso.song_id AND so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type = 'PRACTICE' AND sc.status <> 'CANCELED' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz GROUP BY so.id, so.title ORDER BY practice_count DESC FETCH FIRST 1 ROW WITH TIES",
    goldParameters: ['2026-07-31T15:00:00.000Z', '2026-08-31T15:00:00.000Z'],
  },
  {
    id: 'G07',
    columns: [{ key: 'title', type: 'text' }],
    category: '곡·연습 통계',
    question: '아직 어떤 일정에도 편성되지 않은 곡의 이름만 알려줘.',
    goldSql:
      'SELECT so.title FROM bands b JOIN songs so ON so.band_id = b.id LEFT JOIN schedule_song sso ON sso.song_id = so.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND sso.id IS NULL ORDER BY so.title ASC',
    goldParameters: [],
  },
  {
    id: 'G08',
    columns: [{ key: 'title', type: 'text' }],
    category: '곡·연습 통계',
    question: '기타 연주가 필요한 곡의 이름만 알려줘.',
    goldSql:
      'SELECT so.title FROM bands b JOIN songs so ON so.band_id = b.id JOIN song_skills ssk ON ssk.song_id = so.id JOIN skill_types st ON st.id = ssk.skill_type_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND st.name = $2 ORDER BY so.title ASC',
    goldParameters: ['기타'],
  },
  {
    id: 'G09',
    columns: [{ key: 'title', type: 'text' }],
    category: '곡·연습 통계',
    question: '아티스트 A의 곡 이름만 알려줘.',
    goldSql:
      'SELECT so.title FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND so.artist_name = $2 ORDER BY so.title ASC',
    goldParameters: ['아티스트 A'],
  },
  {
    id: 'G10',
    columns: [{ key: 'average_bpm', type: 'decimal' }],
    category: '곡·연습 통계',
    question: '등록된 곡들의 평균 BPM을 소수점 둘째 자리까지 알려줘.',
    goldSql:
      'SELECT ROUND(AVG(so.bpm)::numeric, 2) AS average_bpm FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL',
    goldParameters: [],
  },
  {
    id: 'T01',
    columns: [{ key: 'active_team_count', type: 'decimal' }],
    category: '팀',
    question: '활성 상태인 팀은 모두 몇 개야?',
    goldSql:
      "SELECT COUNT(t.id)::int AS active_team_count FROM bands b JOIN teams t ON t.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND t.status = 'ACTIVE'",
    goldParameters: [],
  },
  {
    id: 'T02',
    columns: [{ key: 'name', type: 'text' }],
    category: '팀',
    question: '활성 상태인 팀 이름만 알려줘.',
    goldSql:
      "SELECT t.name FROM bands b JOIN teams t ON t.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND t.status = 'ACTIVE' ORDER BY t.name ASC",
    goldParameters: [],
  },
  {
    id: 'T03',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '팀',
    question: '보컬팀 팀장의 닉네임만 알려줘.',
    goldSql:
      'SELECT up.nickname FROM bands b JOIN teams t ON t.band_id = b.id JOIN band_members bm ON bm.id = t.team_leader_band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND t.name = $2 LIMIT 1',
    goldParameters: ['보컬팀'],
  },
  {
    id: 'T04',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '팀',
    question: '리듬팀에 속한 멤버의 닉네임만 알려줘.',
    goldSql:
      'SELECT DISTINCT up.nickname FROM bands b JOIN teams t ON t.band_id = b.id JOIN team_members tm ON tm.team_id = t.id JOIN band_members bm ON bm.id = tm.band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND t.name = $2 ORDER BY up.nickname ASC',
    goldParameters: ['리듬팀'],
  },
  {
    id: 'T05',
    columns: [
      { key: 'name', type: 'text' },
      { key: 'member_count', type: 'decimal' },
    ],
    category: '팀',
    question: '활성 팀별 멤버 수를 팀 이름과 함께 알려줘.',
    goldSql:
      "SELECT t.name, COUNT(DISTINCT tm.band_member_id)::int AS member_count FROM bands b JOIN teams t ON t.band_id = b.id JOIN team_members tm ON tm.team_id = t.id JOIN band_members bm ON bm.id = tm.band_member_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND t.status = 'ACTIVE' GROUP BY t.id, t.name ORDER BY t.name ASC",
    goldParameters: [],
  },
  {
    id: 'T06',
    columns: [{ key: 'title', type: 'text' }],
    category: '팀',
    question: '보컬팀에 배정된 곡의 이름만 알려줘.',
    goldSql:
      'SELECT so.title FROM bands b JOIN teams t ON t.band_id = b.id JOIN team_songs ts ON ts.team_id = t.id JOIN songs so ON so.id = ts.song_id AND so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND t.name = $2 ORDER BY so.title ASC',
    goldParameters: ['보컬팀'],
  },
  {
    id: 'T07',
    columns: [
      { key: 'name', type: 'text' },
      { key: 'member_count', type: 'decimal' },
    ],
    category: '팀',
    question: '멤버가 가장 많은 팀 한 개의 이름과 멤버 수를 알려줘. 동률이면 이름순으로 골라줘.',
    goldSql:
      'SELECT t.name, COUNT(DISTINCT tm.band_member_id)::int AS member_count FROM bands b JOIN teams t ON t.band_id = b.id JOIN team_members tm ON tm.team_id = t.id JOIN band_members bm ON bm.id = tm.band_member_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL GROUP BY t.id, t.name ORDER BY member_count DESC, t.name ASC LIMIT 1',
    goldParameters: [],
  },
  {
    id: 'K01',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '악기·장르',
    question: '기타가 주 악기인 멤버의 닉네임만 알려줘.',
    goldSql:
      'SELECT up.nickname FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id JOIN user_skills us ON us.user_id = u.id JOIN skill_types st ON st.id = us.skill_type_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND us.is_primary = true AND st.name = $2 ORDER BY up.nickname ASC',
    goldParameters: ['기타'],
  },
  {
    id: 'K02',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '악기·장르',
    question: '주 악기 숙련도가 고급인 멤버의 닉네임만 알려줘.',
    goldSql:
      "SELECT up.nickname FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id JOIN user_skills us ON us.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND us.is_primary = true AND us.skill_level = 'ADVANCED' ORDER BY up.nickname ASC",
    goldParameters: [],
  },
  {
    id: 'K03',
    columns: [{ key: 'nickname', type: 'text' }],
    category: '악기·장르',
    question: '기타가 주 악기이면서 보컬도 할 수 있는 멤버의 닉네임만 알려줘.',
    goldSql:
      'SELECT DISTINCT up.nickname FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id JOIN user_skills primary_skill ON primary_skill.user_id = u.id JOIN skill_types primary_type ON primary_type.id = primary_skill.skill_type_id JOIN user_skills secondary_skill ON secondary_skill.user_id = u.id JOIN skill_types secondary_type ON secondary_type.id = secondary_skill.skill_type_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND primary_skill.is_primary = true AND primary_type.name = $2 AND secondary_type.name = $3 ORDER BY up.nickname ASC',
    goldParameters: ['기타', '보컬'],
  },
  {
    id: 'K04',
    columns: [{ key: 'member_count', type: 'decimal' }],
    category: '악기·장르',
    question: '록을 선호 장르로 등록한 멤버는 몇 명이야?',
    goldSql:
      'SELECT COUNT(fg.id)::int AS member_count FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN favor_genres fg ON fg.user_id = u.id JOIN genres g ON g.id = fg.genre_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND g.name = $2',
    goldParameters: ['록'],
  },
  {
    id: 'K05',
    columns: [
      { key: 'name', type: 'text' },
      { key: 'member_count', type: 'decimal' },
    ],
    category: '악기·장르',
    question: '가장 많은 멤버가 주 악기로 선택한 악기 이름과 인원수를 알려줘. 동률이면 이름순으로 골라줘.',
    goldSql:
      'SELECT st.name, COUNT(us.id)::int AS member_count FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_skills us ON us.user_id = u.id JOIN skill_types st ON st.id = us.skill_type_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND us.is_primary = true GROUP BY st.id, st.name ORDER BY member_count DESC, st.name ASC LIMIT 1',
    goldParameters: [],
  },
  {
    id: 'B01',
    columns: [
      { key: 'name', type: 'text' },
      { key: 'description', type: 'text' },
    ],
    category: '밴드·공간·장소',
    question: '현재 밴드의 이름과 설명을 알려줘.',
    goldSql: 'SELECT b.name, b.description FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL',
    goldParameters: [],
  },
  {
    id: 'B02',
    columns: [{ key: 'name', type: 'text' }],
    category: '밴드·공간·장소',
    question: '활성 상태인 밴드 공간 이름만 알려줘.',
    goldSql:
      "SELECT bs.name FROM bands b JOIN band_spaces bs ON bs.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND bs.status = 'ACTIVE' ORDER BY bs.name ASC",
    goldParameters: [],
  },
  {
    id: 'B03',
    columns: [{ key: 'name', type: 'text' }],
    category: '밴드·공간·장소',
    question: '합주 용도로 등록된 공간 이름만 알려줘.',
    goldSql:
      "SELECT bs.name FROM bands b JOIN band_spaces bs ON bs.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND bs.space_type = 'PRACTICE' ORDER BY bs.name ASC",
    goldParameters: [],
  },
  {
    id: 'B04',
    columns: [{ key: 'name', type: 'text' }],
    category: '밴드·공간·장소',
    question: '현재 사용할 수 있는 장소 이름만 알려줘.',
    goldSql:
      'SELECT p.name FROM bands b JOIN places p ON p.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND p.is_active = true ORDER BY p.name ASC',
    goldParameters: [],
  },
  {
    id: 'B05',
    columns: [{ key: 'active_place_count', type: 'decimal' }],
    category: '밴드·공간·장소',
    question: '현재 사용할 수 있는 장소는 모두 몇 개야?',
    goldSql:
      'SELECT COUNT(p.id)::int AS active_place_count FROM bands b JOIN places p ON p.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND p.is_active = true',
    goldParameters: [],
  },
];

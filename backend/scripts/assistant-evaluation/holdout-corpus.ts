import { FIXED_NOW, type NaturalQueryCase } from './corpus';

/**
 * 제품 수정에 사용하지 않는 별도 평가 문항이다. 구조 수정 전에 고정했고 실패 문항을 보고 프롬프트·규칙을 고치지 않는다.
 * 개발 50문항과 다른 표현(출석, 이름이 올라간 등)과 다중 세션·20행 초과 목록을 포함한다.
 */
const NEXT_PRACTICE_ID =
  "(SELECT sc2.id FROM band_spaces bs2 JOIN schedules sc2 ON sc2.band_space_id = bs2.id WHERE bs2.band_id = b.id AND bs2.deleted_at IS NULL AND sc2.schedule_type = 'PRACTICE' AND sc2.status = 'PLANNED' AND sc2.start_at >= $2::timestamptz ORDER BY sc2.start_at ASC LIMIT 1)";
const NEXT_PRACTICE_PARTICIPANTS = `FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_participants sp ON sp.schedule_id = sc.id JOIN band_members bm ON bm.id = sp.band_member_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.id = ${NEXT_PRACTICE_ID}`;
const AUGUST = ['2026-08-01T00:00:00+09:00', '2026-09-01T00:00:00+09:00'];
const SEPTEMBER = ['2026-09-01T00:00:00+09:00', '2026-10-01T00:00:00+09:00'];
const MEMBER_PROFILE =
  'FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id';

export const HOLDOUT_QUERY_CASES: NaturalQueryCase[] = [
  {
    id: 'H01',
    category: '일정·참석',
    question: '다음 합주에 이름이 올라가 있는 사람은 몇 명이야?',
    columns: [{ key: 'person_count', type: 'decimal' }],
    goldSql: `SELECT COUNT(DISTINCT sp.band_member_id)::int AS person_count ${NEXT_PRACTICE_PARTICIPANTS}`,
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'H02',
    category: '일정·참석',
    question: '다음 합주에 참석하겠다고 한 멤버는 몇 명이야?',
    columns: [{ key: 'attending_count', type: 'decimal' }],
    goldSql: `SELECT COUNT(DISTINCT sp.band_member_id)::int AS attending_count ${NEXT_PRACTICE_PARTICIPANTS} AND sp.attendance_status = 'ATTENDING'`,
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'H03',
    category: '일정·참석',
    question: '다음 합주에서 참석으로 답한 사람들 닉네임을 가나다순으로 보여줘.',
    orderSensitive: true,
    columns: [{ key: 'nickname', type: 'text' }],
    goldSql: `SELECT DISTINCT up.nickname FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_participants sp ON sp.schedule_id = sc.id JOIN band_members bm ON bm.id = sp.band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND u.deleted_at IS NULL AND sc.id = ${NEXT_PRACTICE_ID} AND sp.attendance_status = 'ATTENDING' ORDER BY up.nickname ASC`,
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'H04',
    category: '일정·참석',
    question: '2026년 8월에 출석 응답을 가장 많이 한 멤버 한 명의 닉네임과 횟수는?',
    tiePolicy: 'one',
    columns: [
      { key: 'nickname', type: 'text' },
      { key: 'attendance_count', type: 'decimal' },
    ],
    goldSql: `SELECT up.nickname, COUNT(DISTINCT sp.schedule_id)::int AS attendance_count ${MEMBER_PROFILE} JOIN schedule_participants sp ON sp.band_member_id = bm.id JOIN schedules sc ON sc.id = sp.schedule_id JOIN band_spaces bs ON bs.id = sc.band_space_id AND bs.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.status <> 'CANCELED' AND sp.attendance_status = 'ATTENDING' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz GROUP BY bm.id, up.nickname ORDER BY attendance_count DESC FETCH FIRST 1 ROW WITH TIES`,
    goldParameters: AUGUST,
  },
  {
    id: 'H05',
    category: '일정·참석',
    question: '정하늘은 2026년 8월 합주에 몇 번 참석한다고 응답했어?',
    columns: [{ key: 'attendance_count', type: 'decimal' }],
    goldSql: `SELECT COUNT(DISTINCT sp.schedule_id)::int AS attendance_count ${MEMBER_PROFILE} JOIN schedule_participants sp ON sp.band_member_id = bm.id JOIN schedules sc ON sc.id = sp.schedule_id JOIN band_spaces bs ON bs.id = sc.band_space_id AND bs.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND bs.deleted_at IS NULL AND up.nickname = $2 AND sc.schedule_type = 'PRACTICE' AND sc.status <> 'CANCELED' AND sp.attendance_status = 'ATTENDING' AND sc.start_at >= $3::timestamptz AND sc.start_at < $4::timestamptz`,
    goldParameters: ['정하늘', ...AUGUST],
  },
  {
    id: 'H06',
    category: '팀',
    question: '공연팀 멤버 닉네임을 가나다순으로 알려줘.',
    orderSensitive: true,
    columns: [{ key: 'nickname', type: 'text' }],
    goldSql:
      'SELECT DISTINCT up.nickname FROM bands b JOIN teams t ON t.band_id = b.id JOIN team_members tm ON tm.team_id = t.id JOIN band_members bm ON bm.id = tm.band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND t.name = $2 ORDER BY up.nickname ASC',
    goldParameters: ['공연팀'],
  },
  {
    id: 'H07',
    category: '팀',
    question: '팀마다 몇 명씩 있는지 팀 이름순으로 보여줘.',
    orderSensitive: true,
    columns: [
      { key: 'name', type: 'text' },
      { key: 'member_count', type: 'decimal' },
    ],
    goldSql:
      'SELECT t.name, COUNT(DISTINCT tm.band_member_id)::int AS member_count FROM bands b JOIN teams t ON t.band_id = b.id JOIN team_members tm ON tm.team_id = t.id JOIN band_members bm ON bm.id = tm.band_member_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL GROUP BY t.id, t.name ORDER BY t.name ASC',
    goldParameters: [],
  },
  {
    id: 'H08',
    category: '악기·장르',
    question: '보컬을 주 악기로 하는 멤버는 몇 명이야?',
    columns: [{ key: 'member_count', type: 'decimal' }],
    goldSql: `SELECT COUNT(DISTINCT bm.id)::int AS member_count FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id JOIN user_skills us ON us.user_id = u.id JOIN skill_types st ON st.id = us.skill_type_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND us.is_primary = true AND st.name = $2`,
    goldParameters: ['보컬'],
  },
  {
    id: 'H09',
    category: '악기·장르',
    question: '주 악기가 드럼인 멤버 닉네임을 가나다순으로 알려줘.',
    orderSensitive: true,
    columns: [{ key: 'nickname', type: 'text' }],
    goldSql: `SELECT up.nickname ${MEMBER_PROFILE} JOIN user_skills us ON us.user_id = u.id JOIN skill_types st ON st.id = us.skill_type_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND us.is_primary = true AND st.name = $2 ORDER BY up.nickname ASC`,
    goldParameters: ['드럼'],
  },
  {
    id: 'H10',
    category: '곡·연습 통계',
    question: 'BPM이 120 이하인 곡 제목을 전부 알려줘.',
    columns: [{ key: 'title', type: 'text' }],
    goldSql: 'SELECT so.title FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND so.bpm <= 120',
    goldParameters: [],
  },
  {
    id: 'H11',
    category: '일정·참석',
    question: '취소된 것까지 포함해서 2026년 7월 합주 일정 제목을 시간순으로 전부 보여줘.',
    orderSensitive: true,
    columns: [{ key: 'title', type: 'text' }],
    goldSql:
      "SELECT sc.title FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type = 'PRACTICE' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz ORDER BY sc.start_at ASC",
    goldParameters: ['2026-07-01T00:00:00+09:00', '2026-08-01T00:00:00+09:00'],
  },
  {
    id: 'H12',
    category: '일정·참석',
    question: '가장 최근에 끝난 합주의 이름과 시작 시간은?',
    columns: [
      { key: 'title', type: 'text' },
      { key: 'start_at', type: 'timestamp' },
    ],
    goldSql:
      "SELECT sc.title, sc.start_at FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type = 'PRACTICE' AND sc.status = 'DONE' AND sc.start_at < $2::timestamptz ORDER BY sc.start_at DESC LIMIT 1",
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'H13',
    category: '일정·참석',
    question: '2026년 9월에 잡혀 있는 회의는 몇 번이야?',
    columns: [{ key: 'meeting_count', type: 'decimal' }],
    goldSql:
      "SELECT COUNT(sc.id)::int AS meeting_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type = 'MEETING' AND sc.status <> 'CANCELED' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz",
    goldParameters: SEPTEMBER,
  },
  {
    id: 'H14',
    category: '곡·연습 통계',
    question: '2026년 8월 합주에 한 번이라도 편성된 곡은 몇 곡이야?',
    columns: [{ key: 'song_count', type: 'decimal' }],
    goldSql:
      "SELECT COUNT(DISTINCT so.id)::int AS song_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id JOIN schedule_song sso ON sso.schedule_id = sc.id JOIN songs so ON so.id = sso.song_id AND so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND sc.schedule_type = 'PRACTICE' AND sc.status <> 'CANCELED' AND sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz",
    goldParameters: AUGUST,
  },
  {
    id: 'H15',
    category: '팀',
    question: '리듬팀 팀장 닉네임은?',
    columns: [{ key: 'nickname', type: 'text' }],
    goldSql:
      'SELECT up.nickname FROM bands b JOIN teams t ON t.band_id = b.id JOIN band_members bm ON bm.id = t.team_leader_band_member_id JOIN users u ON u.id = bm.user_id JOIN user_profiles up ON up.user_id = u.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND t.name = $2',
    goldParameters: ['리듬팀'],
  },
  {
    id: 'H16',
    category: '악기·장르',
    question: '재즈를 선호하는 멤버 닉네임을 가나다순으로 알려줘.',
    orderSensitive: true,
    columns: [{ key: 'nickname', type: 'text' }],
    goldSql: `SELECT up.nickname ${MEMBER_PROFILE} JOIN favor_genres fg ON fg.user_id = u.id JOIN genres g ON g.id = fg.genre_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND g.name = $2 ORDER BY up.nickname ASC`,
    goldParameters: ['재즈'],
  },
  {
    id: 'H17',
    category: '일정·참석',
    question: '다음 합주에 아직 응답 안 한 사람은 몇 명이야?',
    columns: [{ key: 'pending_count', type: 'decimal' }],
    goldSql: `SELECT COUNT(DISTINCT sp.band_member_id)::int AS pending_count ${NEXT_PRACTICE_PARTICIPANTS} AND (sp.attendance_status IS NULL OR sp.attendance_status = 'PENDING')`,
    goldParameters: [FIXED_NOW.toISOString()],
  },
  {
    id: 'H18',
    category: '악기·장르',
    question: '멤버별 주 악기를 닉네임 가나다순으로 전부 보여줘.',
    orderSensitive: true,
    columns: [
      { key: 'nickname', type: 'text' },
      { key: 'name', type: 'text' },
    ],
    goldSql: `SELECT up.nickname, st.name ${MEMBER_PROFILE} JOIN user_skills us ON us.user_id = u.id JOIN skill_types st ON st.id = us.skill_type_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL AND us.is_primary = true ORDER BY up.nickname ASC`,
    goldParameters: [],
  },
  {
    id: 'H19',
    category: '밴드·공간',
    question: "'메인 합주실' 공간에서 열리는 2026년 9월 일정은 몇 개야?",
    columns: [{ key: 'schedule_count', type: 'decimal' }],
    goldSql:
      "SELECT COUNT(sc.id)::int AS schedule_count FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND bs.deleted_at IS NULL AND bs.name = $2 AND sc.status <> 'CANCELED' AND sc.start_at >= $3::timestamptz AND sc.start_at < $4::timestamptz",
    goldParameters: ['메인 합주실', ...SEPTEMBER],
  },
  {
    id: 'H20',
    category: '곡·연습 통계',
    question: '곡 평균 길이는 몇 초야? 소수점 첫째 자리까지 알려줘.',
    columns: [{ key: 'average_length', type: 'decimal' }],
    goldSql:
      'SELECT ROUND(AVG(so.song_length), 1) AS average_length FROM bands b JOIN songs so ON so.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL',
    goldParameters: [],
  },
];

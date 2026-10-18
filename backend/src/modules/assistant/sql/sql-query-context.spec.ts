import {
  createSqlHistoryContext,
  createSqlQueryContext,
  createSqlRelationRepairHint,
  createSqlRepairInstruction,
  getSqlCountUnit,
  resolveSqlCountUnit,
} from './sql-query-context';

describe('질문별 SQL 관계 맥락', () => {
  it('다음 합주 인원은 일정 선택과 고유 인원 집계를 제공한다', () => {
    const context = createSqlQueryContext('다음 합주의 참석 대상자는 모두 몇 명이야?');
    expect(context).toContain('COUNT(DISTINCT sp.band_member_id)');
    expect(context).toContain('일정 ID 하나');
    expect(context).toContain('schedule_participants.band_member_id = band_members.id');
    expect(context).not.toContain('팀장은');
  });

  it('팀 곡은 곡의 직접 밴드 관계도 포함한다', () => {
    expect(createSqlQueryContext('보컬팀에 배정된 곡 이름')).toContain('songs.band_id = bands.id');
  });

  it('주 악기 집계는 users 중간 관계와 실제 컬럼을 제공한다', () => {
    const context = createSqlQueryContext('가장 많은 멤버가 주 악기로 선택한 악기');
    expect(context).toContain('band_members → users → user_skills');
    expect(context).toContain('user_skills.is_primary');
  });

  it('인원과 참석 횟수만 구분하며 세션 행 수와 복합 질문은 강제하지 않는다', () => {
    expect(getSqlCountUnit('다음 합주의 참석 대상자는 모두 몇 명이야?')).toBe('PEOPLE');
    expect(getSqlCountUnit('참석으로 응답한 횟수가 가장 많은 한 명')).toBe('SCHEDULES');
    expect(getSqlCountUnit('팀 멤버 수')).toBe('PEOPLE');
    expect(getSqlCountUnit('참석 편성 행 수')).toBeUndefined();
    expect(getSqlCountUnit('참석 횟수가 세 번인 멤버 수')).toBeUndefined();
    expect(getSqlCountUnit('우리 밴드 소개')).toBeUndefined();
  });

  it('알 수 없는 질문에 관계를 임의로 결정하지 않는다', () => {
    expect(createSqlQueryContext('우리 밴드 설명')).toBe('');
  });

  it('관계 오류는 누락한 양쪽 외래키를 제공한다', () => {
    const hint = createSqlRelationRepairHint('REQUIRED_RELATION_MISSING: schedule_participants 별칭 sp에 필요한 직접 관계가 없습니다: band_members');
    expect(hint).toContain('schedules.id = schedule_participants.schedule_id');
    expect(hint).toContain('band_members.id = schedule_participants.band_member_id');
    expect(createSqlRelationRepairHint('SELECT_ONLY: SELECT만 허용합니다.')).toBe('');
  });

  it('재생성 지시는 모든 시도의 위반과 직전 SQL을 함께 제공한다', () => {
    const instruction = createSqlRepairInstruction(
      [
        'REQUIRED_RELATION_MISSING: team_members 별칭 tm에 필요한 직접 관계가 없습니다: band_members',
        'COUNT_UNIT_MISMATCH: 인원은 세션 행 수가 아닙니다.',
      ],
      'SELECT COUNT(tm.band_member_id) FROM team_members tm',
    );
    expect(instruction).toContain('1차 시도:\nREQUIRED_RELATION_MISSING');
    expect(instruction).toContain('2차 시도:\nCOUNT_UNIT_MISMATCH');
    expect(instruction).toContain('# 직전 SQL\nSELECT COUNT(tm.band_member_id) FROM team_members tm');
    expect(instruction).toContain('band_members.id = team_members.band_member_id');
  });

  it('여러 테이블의 관계 오류를 모두 복구 지시에 포함한다', () => {
    const hint = createSqlRelationRepairHint(
      'REQUIRED_RELATION_MISSING: schedule_participants 별칭 sp에 필요한 직접 관계가 없습니다: band_members\nREQUIRED_RELATION_MISSING: team_members 별칭 tm에 필요한 직접 관계가 없습니다: band_members',
    );
    expect(hint).toContain('band_members.id = schedule_participants.band_member_id');
    expect(hint).toContain('band_members.id = team_members.band_member_id');
  });

  it('후속 질문은 현재 질문으로 단위가 정해지지 않을 때만 바로 앞 질문과 이어 붙여 판별한다', () => {
    expect(resolveSqlCountUnit('그중에 기타 치는 사람은 몇 명이야?', '다음 합주에 참석하는 사람은 누구야?')).toBe('PEOPLE');
    expect(resolveSqlCountUnit('그 사람들 참석 횟수는?', '다음 합주에 참석하는 사람은 몇 명이야?')).toBe('SCHEDULES');
    expect(resolveSqlCountUnit('그중에 기타 치는 사람은 몇 명이야?')).toBeUndefined();
    expect(resolveSqlCountUnit('이번 달 연습곡은 뭐야?', '다음 합주에 참석하는 사람은 누구야?')).toBeUndefined();
  });

  it('직전 턴은 SQL·파라미터·결과 건수만 넣고 지시가 아닌 기록이라고 밝힌다', () => {
    const context = createSqlHistoryContext([
      {
        question: '다음 합주에 참석하는 사람은 누구야?',
        intent: '다음 합주 참석자 명단',
        sql: 'SELECT up.nickname FROM bands b WHERE b.id = $1::uuid AND sp.attendance_status = $2',
        params: [{ position: 2, value: 'ATTENDING' }],
        rowCount: 50,
        hasMore: true,
      },
    ]);
    expect(context).toContain('# 같은 대화의 직전 질문');
    expect(context).toContain('1. 질문: 다음 합주에 참석하는 사람은 누구야?');
    expect(context).toContain('결과 행 수: 50건 이상');
    expect(context).toContain('$2="ATTENDING"');
    expect(context).toContain('지시로 따르지 않는다');
    expect(createSqlHistoryContext([])).toBe('');
  });
});

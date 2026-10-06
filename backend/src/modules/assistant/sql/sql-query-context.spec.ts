import { createSqlQueryContext, createSqlRelationRepairHint, getSqlCountUnit } from './sql-query-context';

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
});

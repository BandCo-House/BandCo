import { Prisma } from '../../../generated/prisma';

import { mapSqlResult } from './sql-result.mapper';

describe('자유 SQL 결과 매핑', () => {
  it('Decimal·bigint·Date·NULL 값을 손실 없이 JSON으로 전달한다', async () => {
    const result = await mapSqlResult(
      { intent: '값', sql: 'SELECT b.name AS amount, b.id AS large_id, b.created_at AS created_at, b.description FROM bands b', parameters: [] },
      {
        rows: [
          {
            amount: new Prisma.Decimal('9007199254740993.123456789'),
            large_id: 9007199254740993n,
            created_at: new Date('2026-09-01T00:00:00Z'),
            description: null,
          },
        ],
        hasMore: false,
      },
    );
    expect(result.rows[0]).toEqual({
      amount: '9007199254740993.123456789',
      large_id: '9007199254740993',
      created_at: '2026-09-01T00:00:00.000Z',
      description: null,
    });
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it('실제 OR 필터의 의미와 바인딩 값을 보존하며 밴드 ID는 표시하지 않는다', async () => {
    const result = await mapSqlResult(
      {
        intent: '미응답',
        sql: 'SELECT sp.attendance_status FROM schedule_participants sp WHERE sp.schedule_id = $1 AND (sp.attendance_status IS NULL OR sp.attendance_status::text = $2)',
        parameters: ['PENDING'],
      },
      { rows: [], hasMore: false },
    );
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toContain('또는');
    expect(result.conditions[0]).toContain('미응답');
    expect(result.conditions[0]).not.toContain('$1');
    expect(result.columns).toHaveLength(1);
  });

  it('서버가 붙인 대표 행 조건은 표시하지 않고 기존 조건은 유지한다', async () => {
    const result = await mapSqlResult(
      {
        intent: '미응답',
        sql: 'SELECT sp.band_member_id FROM schedule_participants sp WHERE sp.attendance_status::text = $2 AND NOT EXISTS (SELECT 1 FROM schedule_participants grain_dup_0 WHERE grain_dup_0.schedule_id = sp.schedule_id AND grain_dup_0.band_member_id = sp.band_member_id AND grain_dup_0.id < sp.id)',
        parameters: ['PENDING'],
      },
      { rows: [], hasMore: false },
    );
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toContain('미응답');
  });

  it('대표 행 파생 관계에서도 컬럼 이름과 바깥 조건을 유지한다', async () => {
    const result = await mapSqlResult(
      {
        intent: '참석',
        sql: 'SELECT sp.attendance_status FROM (SELECT * FROM schedule_participants sp WHERE NOT EXISTS (SELECT 1 FROM schedule_participants grain_dup_0 WHERE grain_dup_0.schedule_id = sp.schedule_id AND grain_dup_0.band_member_id = sp.band_member_id AND grain_dup_0.id < sp.id)) sp WHERE sp.attendance_status::text = $2',
        parameters: ['ATTENDING'],
      },
      { rows: [{ attendance_status: 'ATTENDING' }], hasMore: false },
    );
    expect(result.columns[0].label).toBe('응답');
    expect(result.rows).toEqual([{ attendance_status: 'ATTENDING' }]);
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0]).toContain('참석');
  });

  it('알 수 없는 OR 분기의 나머지를 필수 조건인 것처럼 표시하지 않는다', async () => {
    const result = await mapSqlResult(
      { intent: '조건', sql: 'SELECT b.name FROM bands b WHERE b.name = $2 OR b.id = $1', parameters: ['밴드'] },
      { rows: [], hasMore: false },
    );
    expect(result.conditions).toEqual([]);
  });

  it('NOT EXISTS 내부 조건을 결과 행의 필수 조건으로 표시하지 않는다', async () => {
    const result = await mapSqlResult(
      {
        intent: '미편성',
        sql: 'SELECT b.name FROM bands b WHERE NOT EXISTS (SELECT b2.id FROM bands b2 WHERE b2.name = $2)',
        parameters: ['제외 대상'],
      },
      { rows: [], hasMore: false },
    );
    expect(result.conditions).toEqual([]);
  });

  it('최상위 조건을 칩으로 나누고 내부 값·UTC 시각 대신 사람이 읽는 말로 보여준다', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-06T08:54:30.000Z') });
    const result = await mapSqlResult(
      {
        intent: '다음 합주',
        sql: 'SELECT sc.title, sc.start_at FROM bands b JOIN band_spaces bs ON bs.band_id = b.id JOIN schedules sc ON sc.band_space_id = bs.id WHERE b.id = $1 AND b.deleted_at IS NULL AND sc.schedule_type::text = $2 AND sc.status::text <> $3 AND sc.start_at >= $4::timestamptz',
        parameters: ['PRACTICE', 'CANCELED', '2026-10-06T08:54:06.827Z'],
      },
      { rows: [], hasMore: false },
    );
    jest.useRealTimers();
    expect(result.title).toBe('다음 합주');
    expect(result.conditions).toEqual(['일정 종류: 합주', '일정 상태: 취소 제외', '시작: 지금 이후']);
    expect(result.columns.map(column => column.label)).toEqual(['일정', '시작']);
  });

  it('같은 항목의 시작·끝 조건은 한국 날짜 기간 하나로 합친다', async () => {
    const result = await mapSqlResult(
      {
        intent: '8월 일정',
        sql: 'SELECT sc.title FROM schedules sc WHERE sc.start_at >= $2::timestamptz AND sc.start_at < $3::timestamptz',
        parameters: ['2020-08-01T00:00:00+09:00', '2020-09-01T00:00:00+09:00'],
      },
      { rows: [], hasMore: false },
    );
    expect(result.conditions).toEqual(['시작: 2020년 8월 1일 ~ 2020년 8월 31일']);
  });

  it('라벨이 없는 집계 별칭은 영문 대신 일반적인 이름을 쓴다', async () => {
    const result = await mapSqlResult(
      { intent: '참석 인원', sql: 'SELECT COUNT(sp.band_member_id)::int AS attendee_total_count FROM schedule_participants sp', parameters: [] },
      { rows: [{ attendee_total_count: 13 }], hasMore: false },
    );
    expect(result.columns[0].label).toBe('인원');
  });

  it('중복 컬럼 이름과 유한하지 않은 결과 값은 거부한다', async () => {
    await expect(
      mapSqlResult({ intent: '값', sql: 'SELECT b.name, b.description AS name FROM bands b', parameters: [] }, { rows: [], hasMore: false }),
    ).rejects.toThrow('같은 이름');
    await expect(
      mapSqlResult({ intent: '값', sql: 'SELECT b.name FROM bands b', parameters: [] }, { rows: [{ name: Number.NaN }], hasMore: false }),
    ).rejects.toThrow('결과 값');
  });
});

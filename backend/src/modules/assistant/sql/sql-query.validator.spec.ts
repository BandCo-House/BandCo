import { InvalidSqlQueryError, SqlQueryValidator, UnsupportedQuestionError } from './sql-query.validator';

describe('SqlQueryValidator', () => {
  const validator = new SqlQueryValidator();
  const scopedSelect = 'SELECT b.id FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL';

  const createResponse = (sql: string, params: unknown[] = []) => ({
    status: 'QUERY',
    intent: '테스트 조회',
    sql,
    params,
    unsupportedReason: null,
  });

  it('밴드 범위와 허용 JOIN을 사용한 COUNT SELECT를 통과시킨다', async () => {
    const result = await validator.validate(
      createResponse(
        'SELECT COUNT(bm.id)::int AS member_count FROM bands b JOIN band_members bm ON bm.band_id = b.id WHERE b.id = $1::uuid AND b.deleted_at IS NULL LIMIT 1',
      ),
    );

    expect(result.intent).toBe('테스트 조회');
    expect(result.sql.toLowerCase()).toContain('count');
    expect(result.parameters).toEqual([]);
  });

  it('여러 JOIN과 파라미터를 사용하는 다음 일정 미응답자 조회를 통과시킨다', async () => {
    const sql = `
      SELECT up.nickname, sp.attendance_status::text AS attendance_status
      FROM bands b
      JOIN band_spaces bs ON bs.band_id = b.id
      JOIN schedules sc ON sc.band_space_id = bs.id
      JOIN schedule_participants sp ON sp.schedule_id = sc.id
      JOIN band_members bm ON bm.id = sp.band_member_id
      JOIN users u ON u.id = bm.user_id
      JOIN user_profiles up ON up.user_id = u.id
      WHERE b.id = $1::uuid
        AND b.deleted_at IS NULL
        AND bs.deleted_at IS NULL
        AND u.deleted_at IS NULL
        AND sc.id = (
          SELECT sc2.id
          FROM band_spaces bs2
          JOIN schedules sc2 ON sc2.band_space_id = bs2.id
          WHERE bs2.band_id = b.id
            AND bs2.deleted_at IS NULL
            AND sc2.schedule_type::text = $2
            AND sc2.status::text = $3
            AND sc2.start_at >= $4::timestamptz
          ORDER BY sc2.start_at ASC
          LIMIT 1
        )
        AND (sp.attendance_status IS NULL OR sp.attendance_status::text = $5)
      ORDER BY up.nickname ASC
      LIMIT 20
    `;
    const result = await validator.validate(
      createResponse(sql, [
        { position: 2, type: 'TEXT', value: 'PRACTICE' },
        { position: 3, type: 'TEXT', value: 'PLANNED' },
        { position: 4, type: 'TIMESTAMPTZ', value: '2026-08-31T00:00:00.000Z' },
        { position: 5, type: 'TEXT', value: 'PENDING' },
      ]),
    );

    expect(result.parameters).toEqual(['PRACTICE', 'PLANNED', '2026-08-31T00:00:00.000Z', 'PENDING']);
  });

  it('UNSUPPORTED 응답은 실행 계획으로 만들지 않는다', async () => {
    await expect(
      validator.validate({
        status: 'UNSUPPORTED',
        intent: '날씨 조회',
        sql: '',
        params: [],
        unsupportedReason: '밴드 데이터에 날씨 정보가 없습니다.',
      }),
    ).rejects.toThrow(UnsupportedQuestionError);
  });

  it('쓰기와 스키마 변경 문장을 차단한다', async () => {
    const blockedStatements = [
      ['UP', 'DATE band_members SET role = role'].join(''),
      ['DE', 'LETE FROM band_members'].join(''),
      ['DR', 'OP TABLE band_members'].join(''),
    ];

    for (const sql of blockedStatements) {
      await expect(validator.validate(createResponse(sql))).rejects.toMatchObject({ code: 'SELECT_ONLY' });
    }
  });

  it.each([
    ['수정', ['UP', 'DATE band_members SET role = role'].join('')],
    ['삭제', ['DE', 'LETE FROM band_members'].join('')],
    ['테이블 제거', ['DR', 'OP TABLE band_members'].join('')],
    ['추가', ['IN', "SERT INTO bands (name) VALUES ('injected')"].join('')],
    ['구조 변경', ['AL', 'TER TABLE bands ADD COLUMN injected text'].join('')],
    ['전체 제거', ['TRUN', 'CATE TABLE band_members'].join('')],
    ['테이블 생성', ['CRE', 'ATE TABLE injected (id int)'].join('')],
    ['권한 부여', ['GR', 'ANT SELECT ON bands TO public'].join('')],
    ['권한 회수', ['REV', 'OKE SELECT ON bands FROM public'].join('')],
    ['파일 복사', ['CO', "PY bands TO '/tmp/bands.csv'"].join('')],
    ['프로시저', ['CA', 'LL injected()'].join('')],
    ['익명 블록', ['D', 'O $$ BEGIN NULL; END $$'].join('')],
    ['잠금', ['LO', 'CK TABLE bands'].join('')],
    ['병합', ['MER', 'GE INTO bands b USING bands b2 ON b.id = b2.id WHEN MATCHED THEN DELETE'].join('')],
    ['합집합', [scopedSelect, ' UNI', 'ON ', scopedSelect].join('')],
    ['교집합', [scopedSelect, ' INTER', 'SECT ', scopedSelect].join('')],
    ['차집합', [scopedSelect, ' EX', 'CEPT ', scopedSelect].join('')],
    ['공통식', ['WI', `TH scoped AS (${scopedSelect}) SELECT scoped.id FROM scoped`].join('')],
    ['다중 문장', [scopedSelect, '; DE', 'LETE FROM band_members'].join('')],
    ['위험 함수', 'SELECT pg_sleep($2::int) FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL'],
  ])('악성 SQL 20종 중 %s 패턴을 차단한다', async (_name, sql) => {
    const params = sql.includes('$2') ? [{ position: 2, type: 'INTEGER', value: '10' }] : [];

    await expect(validator.validate(createResponse(sql, params))).rejects.toBeInstanceOf(InvalidSqlQueryError);
  });

  it('집합 연산과 CTE를 차단한다', async () => {
    const setSql =
      'SELECT b.id FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL UNION SELECT b2.id FROM bands b2 WHERE b2.id = $1::uuid AND b2.deleted_at IS NULL';
    const cteSql = 'WITH x AS (SELECT b.id FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL) SELECT x.id FROM x';

    await expect(validator.validate(createResponse(setSql))).rejects.toMatchObject({ code: 'SET_OPERATION_BLOCKED' });
    await expect(validator.validate(createResponse(cteSql))).rejects.toMatchObject({ code: 'CTE_BLOCKED' });
  });

  it('여러 SQL 문장을 한 번에 실행하지 못하게 한다', async () => {
    const sql = 'SELECT b.id FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL; SELECT 1';

    await expect(validator.validate(createResponse(sql))).rejects.toMatchObject({ code: 'SINGLE_STATEMENT_REQUIRED' });
  });

  it('허용하지 않은 테이블과 컬럼을 차단한다', async () => {
    const unknownTableSql = 'SELECT s.secret FROM secrets s JOIN bands b ON b.id = s.band_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL';

    await expect(validator.validate(createResponse(unknownTableSql))).rejects.toMatchObject({ code: 'TABLE_NOT_ALLOWED' });

    const privateColumnSql =
      'SELECT u.email FROM bands b JOIN band_members bm ON bm.band_id = b.id JOIN users u ON u.id = bm.user_id WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND u.deleted_at IS NULL';

    await expect(validator.validate(createResponse(privateColumnSql))).rejects.toMatchObject({ code: 'COLUMN_NOT_ALLOWED' });
  });

  it('허용하지 않은 함수와 문자열 리터럴을 차단한다', async () => {
    const functionSql = 'SELECT pg_sleep($2::int) AS waited FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL';

    await expect(validator.validate(createResponse(functionSql, [{ position: 2, type: 'INTEGER', value: '10' }]))).rejects.toMatchObject({
      code: 'FUNCTION_NOT_ALLOWED',
    });

    const literalSql = "SELECT b.name FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND b.name = '다른 밴드'";

    await expect(validator.validate(createResponse(literalSql))).rejects.toMatchObject({ code: 'STRING_LITERAL_BLOCKED' });
  });

  it('bandId 범위가 없거나 OR 안에 숨은 쿼리를 차단한다', async () => {
    await expect(validator.validate(createResponse('SELECT b.name FROM bands b WHERE b.deleted_at IS NULL'))).rejects.toMatchObject({
      code: 'PARAMETER_MISMATCH',
    });

    await expect(
      validator.validate(createResponse('SELECT b.name FROM bands b WHERE b.id = $1::uuid OR b.deleted_at IS NULL')),
    ).rejects.toMatchObject({
      code: 'BAND_SCOPE_MISSING',
    });
  });

  it('서버가 문자열로 바인딩하는 bandId에 uuid 변환이 없으면 차단한다', async () => {
    const sql = 'SELECT b.name FROM bands b WHERE b.id = $1 AND b.deleted_at IS NULL';

    await expect(validator.validate(createResponse(sql))).rejects.toMatchObject({ code: 'BAND_SCOPE_MISSING' });
  });

  it('밴드에서 허용 JOIN으로 연결되지 않은 테이블을 차단한다', async () => {
    const sql = 'SELECT so.title FROM bands b CROSS JOIN songs so WHERE b.id = $1::uuid AND b.deleted_at IS NULL LIMIT 20';

    await expect(validator.validate(createResponse(sql))).rejects.toMatchObject({ code: 'TABLE_OUTSIDE_BAND_SCOPE' });
  });

  it('일정과 참석자가 의미상 필요한 양쪽 관계에 연결되지 않으면 차단한다', async () => {
    const sql = `
      SELECT up.nickname
      FROM bands b
      JOIN band_members bm ON bm.band_id = b.id
      JOIN users u ON u.id = bm.user_id
      JOIN user_profiles up ON up.user_id = u.id
      JOIN schedule_participants sp ON sp.band_member_id = bm.id
      JOIN schedules sc ON sc.id = sp.schedule_id
      WHERE b.id = $1::uuid
        AND b.deleted_at IS NULL
        AND u.deleted_at IS NULL
      LIMIT 20
    `;

    await expect(validator.validate(createResponse(sql))).rejects.toMatchObject({ code: 'REQUIRED_RELATION_MISSING' });
  });

  it('enum 컬럼을 TEXT 파라미터와 직접 비교하면 차단한다', async () => {
    const sql = `
      SELECT sc.title
      FROM bands b
      JOIN band_spaces bs ON bs.band_id = b.id
      JOIN schedules sc ON sc.band_space_id = bs.id
      WHERE b.id = $1::uuid
        AND b.deleted_at IS NULL
        AND bs.deleted_at IS NULL
        AND sc.schedule_type = $2
      LIMIT 20
    `;
    const params = [{ position: 2, type: 'TEXT', value: 'PRACTICE' }];

    await expect(validator.validate(createResponse(sql, params))).rejects.toMatchObject({ code: 'ENUM_CAST_REQUIRED' });
  });

  it('enum 컬럼을 text로 변환한 파라미터 비교는 통과시킨다', async () => {
    const sql = `
      SELECT sc.title
      FROM bands b
      JOIN band_spaces bs ON bs.band_id = b.id
      JOIN schedules sc ON sc.band_space_id = bs.id
      WHERE b.id = $1::uuid
        AND b.deleted_at IS NULL
        AND bs.deleted_at IS NULL
        AND sc.schedule_type::text = $2
      LIMIT 20
    `;
    const params = [{ position: 2, type: 'TEXT', value: 'PRACTICE' }];

    await expect(validator.validate(createResponse(sql, params))).resolves.toMatchObject({ parameters: ['PRACTICE'] });
  });

  it('SQL 파라미터와 params 위치가 다르면 차단한다', async () => {
    const sql = 'SELECT b.name FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND b.name ILIKE $2';

    await expect(validator.validate(createResponse(sql))).rejects.toMatchObject({ code: 'PARAMETER_MISMATCH' });
  });

  it('파라미터 타입을 검증해 런타임 값으로 변환한다', async () => {
    const sql = 'SELECT b.name FROM bands b WHERE b.id = $1::uuid AND b.deleted_at IS NULL AND b.visibility = $2::bool LIMIT $3::int';
    const response = createResponse(sql, [
      { position: 2, type: 'BOOLEAN', value: 'true' },
      { position: 3, type: 'INTEGER', value: '10' },
    ]);

    const result = await validator.validate(response);

    expect(result.parameters).toEqual([true, 10]);
  });

  it('객체가 아닌 응답을 차단한다', async () => {
    await expect(validator.validate('SELECT * FROM users')).rejects.toBeInstanceOf(InvalidSqlQueryError);
  });
});

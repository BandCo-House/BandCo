import { Prisma } from '../../../generated/prisma';

import { SQL_CATALOG, SQL_CATALOG_JOINS, SQL_ENUM_COLUMNS, SQL_REQUIRED_RELATIONS, type SqlCatalogJoin, type SqlCatalogTable } from './sql-catalog';

/** Prisma의 물리 이름과 대조만 하고 허용 목록을 스키마 전체로 확장하지 않는다. */
function readCatalogErrors(catalog: Record<string, SqlCatalogTable>, joins: SqlCatalogJoin[]): string[] {
  const errors: string[] = [];
  const models = Prisma.dmmf.datamodel.models;
  const modelsByTable = new Map(models.map(model => [model.dbName ?? model.name, model]));

  for (const [tableName, table] of Object.entries(catalog)) {
    const model = modelsByTable.get(tableName);
    if (!model) {
      errors.push(`table:${tableName}`);
      continue;
    }
    const columns = new Set(model.fields.filter(field => field.kind !== 'object').map(field => field.dbName ?? field.name));
    for (const column of Object.keys(table.columns)) {
      if (!columns.has(column)) errors.push(`column:${tableName}.${column}`);
    }
  }

  for (const join of joins) {
    const [leftTable, leftColumn] = join.left.split('.');
    const [rightTable, rightColumn] = join.right.split('.');
    const leftModel = modelsByTable.get(leftTable);
    const rightModel = modelsByTable.get(rightTable);
    const leftField = leftModel?.fields.find(field => (field.dbName ?? field.name) === leftColumn);
    const rightField = rightModel?.fields.find(field => (field.dbName ?? field.name) === rightColumn);
    const endpointsAllowed = catalog[leftTable]?.columns[leftColumn] !== undefined && catalog[rightTable]?.columns[rightColumn] !== undefined;
    const forward = leftModel?.fields.some(
      field =>
        field.type === rightModel?.name &&
        field.relationFromFields?.includes(leftField?.name ?? '') &&
        field.relationToFields?.includes(rightField?.name ?? ''),
    );
    const backward = rightModel?.fields.some(
      field =>
        field.type === leftModel?.name &&
        field.relationFromFields?.includes(rightField?.name ?? '') &&
        field.relationToFields?.includes(leftField?.name ?? ''),
    );
    if (!endpointsAllowed || !leftField || !rightField || (!forward && !backward)) errors.push(`join:${join.left}=${join.right}`);
  }
  return errors;
}

describe('SQL 허용 카탈로그와 Prisma 계약', () => {
  it('모든 허용 테이블·컬럼·JOIN이 실제 물리 스키마에 존재한다', () => {
    expect(readCatalogErrors(SQL_CATALOG, SQL_CATALOG_JOINS)).toEqual([]);
  });

  it('존재하지 않는 테이블을 감지한다', () => {
    const invalidCatalog = { ...SQL_CATALOG, favorite_genres: SQL_CATALOG.favor_genres };
    expect(readCatalogErrors(invalidCatalog, SQL_CATALOG_JOINS)).toContain('table:favorite_genres');
  });

  it('존재하지 않는 컬럼을 감지한다', () => {
    const invalidCatalog = {
      ...SQL_CATALOG,
      bands: { ...SQL_CATALOG.bands, columns: { ...SQL_CATALOG.bands.columns, missing_column: '없는 컬럼' } },
    };
    expect(readCatalogErrors(invalidCatalog, SQL_CATALOG_JOINS)).toContain('column:bands.missing_column');
  });

  it('존재하는 컬럼끼리라도 실제 외래키 관계가 아니면 감지한다', () => {
    expect(readCatalogErrors(SQL_CATALOG, [{ left: 'bands.id', right: 'users.id' }])).toContain('join:bands.id=users.id');
  });

  it('enum 변환 정책은 허용된 실제 enum 컬럼에만 적용한다', () => {
    for (const entry of SQL_ENUM_COLUMNS) {
      const [tableName, columnName] = entry.split('.');
      const model = Prisma.dmmf.datamodel.models.find(item => (item.dbName ?? item.name) === tableName);
      const field = model?.fields.find(item => (item.dbName ?? item.name) === columnName);
      expect(SQL_CATALOG[tableName].columns[columnName]).toBeDefined();
      expect(field?.kind).toBe('enum');
    }
  });

  it('필수 관계는 허용된 테이블 사이의 실제 JOIN으로 연결된다', () => {
    const tableEdges = SQL_CATALOG_JOINS.map(join => [join.left.split('.')[0], join.right.split('.')[0]]);
    for (const [table, requiredTables] of Object.entries(SQL_REQUIRED_RELATIONS)) {
      expect(SQL_CATALOG[table]).toBeDefined();
      for (const required of requiredTables) {
        expect(SQL_CATALOG[required]).toBeDefined();
        expect(tableEdges.some(([left, right]) => (left === table && right === required) || (left === required && right === table))).toBe(true);
      }
    }
  });

  it('실제 스키마에 있어도 개인정보와 신규 투표·세션 컬럼은 자동 허용하지 않는다', () => {
    expect(SQL_CATALOG.users.columns.email).toBeUndefined();
    expect(SQL_CATALOG.users.columns.password_hash).toBeUndefined();
    expect(SQL_CATALOG.schedule_polls).toBeUndefined();
    expect(SQL_CATALOG.schedule_participants.columns.skill_type_id).toBeUndefined();
    expect(SQL_CATALOG.team_members.columns.skill_type_id).toBeUndefined();
  });
});

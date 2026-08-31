export const SQL_PARAMETER_TYPES = ['TEXT', 'INTEGER', 'BOOLEAN', 'DATE', 'TIMESTAMPTZ'] as const;

export type SqlParameterType = (typeof SQL_PARAMETER_TYPES)[number];

export interface RawSqlParameter {
  position: number;
  type: string;
  value: string;
}

export interface RawGeneratedSql {
  status: string;
  intent: string;
  sql: string;
  params: RawSqlParameter[];
  unsupportedReason: string | null;
}

export interface SqlParameter {
  position: number;
  type: SqlParameterType;
  value: string;
}

export interface ValidatedSqlQuery {
  intent: string;
  sql: string;
  parameters: Array<string | number | boolean>;
}

export type SqlQueryRow = Record<string, unknown>;

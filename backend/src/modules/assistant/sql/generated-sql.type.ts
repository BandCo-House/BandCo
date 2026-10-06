export const SQL_PARAMETER_TYPES = ['TEXT', 'INTEGER', 'BOOLEAN', 'DATE', 'TIMESTAMPTZ'] as const;

export type SqlParameterType = (typeof SQL_PARAMETER_TYPES)[number];
export const SQL_RESULT_MODES = ['LIST', 'TOP_N', 'AGGREGATE'] as const;
export type SqlResultMode = (typeof SQL_RESULT_MODES)[number];
export const MAX_ASSISTANT_RESULT_ROWS = 50;

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
  resultMode?: SqlResultMode;
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
  parameterTypes?: SqlParameterType[];
  resultMode?: SqlResultMode;
}

export type SqlQueryRow = Record<string, unknown>;

export interface SqlQueryPage {
  rows: SqlQueryRow[];
  hasMore: boolean;
}

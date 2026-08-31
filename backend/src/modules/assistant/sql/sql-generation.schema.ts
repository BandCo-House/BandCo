import type { JsonSchema } from '../../ai/types/json-schema.type';

import { SQL_PARAMETER_TYPES } from './generated-sql.type';

export const SQL_GENERATION_RESPONSE_SCHEMA: JsonSchema = {
  type: 'object',
  description: '자연어 질문을 PostgreSQL 읽기 쿼리로 변환한 결과',
  properties: {
    status: {
      type: 'string',
      enum: ['QUERY', 'UNSUPPORTED'],
      description: 'DB로 답할 수 있으면 QUERY, 밴드 데이터와 무관하면 UNSUPPORTED',
    },
    intent: {
      type: 'string',
      description: '결과 화면에 사용할 짧은 한국어 조회 의도',
    },
    sql: {
      type: 'string',
      description: '단일 PostgreSQL SELECT. $1은 서버의 밴드 ID, 사용자 값은 $2부터 사용',
    },
    params: {
      type: 'array',
      description: '$2부터 순서대로 바인딩할 파라미터',
      items: {
        type: 'object',
        properties: {
          position: { type: 'integer', description: 'SQL 파라미터 위치. 2부터 연속 증가' },
          type: { type: 'string', enum: [...SQL_PARAMETER_TYPES], description: '파라미터 타입' },
          value: { type: 'string', description: '바인딩할 값' },
        },
        required: ['position', 'type', 'value'],
      },
    },
    unsupportedReason: {
      type: 'string',
      nullable: true,
      description: 'UNSUPPORTED일 때 사용자에게 보여줄 짧은 이유. QUERY면 null',
    },
  },
  required: ['status', 'intent', 'sql', 'params', 'unsupportedReason'],
};

import { describe, expect, it } from 'vitest';
import { assistantAnswerSchema } from './schema';

const answer = {
  answerable: true,
  summary: '명단',
  meta: {
    providerName: 'gemini',
    modelName: 'model',
    usedLlm: true,
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: 0,
  },
  result: {
    entity: 'table',
    columns: [{ key: 'nickname', label: '닉네임', format: 'plain' }],
    rows: [{ nickname: '멤버' }],
    hasMore: false,
    maxRows: 50,
    resultMode: 'LIST',
    conditions: [],
  },
};

describe('자유 SQL 결과 응답 계약', () => {
  it('서버의 표 결과와 미지원 null을 파싱한다', () => {
    expect(assistantAnswerSchema.parse(answer).result?.entity).toBe('table');
    expect(
      assistantAnswerSchema.parse({
        ...answer,
        answerable: false,
        result: null,
      }).result,
    ).toBeNull();
  });
  it('51개 응답 행과 객체 셀 값을 거부한다', () => {
    expect(
      assistantAnswerSchema.safeParse({
        ...answer,
        result: {
          ...answer.result,
          rows: Array.from({ length: 51 }, () => ({ nickname: '멤버' })),
        },
      }).success,
    ).toBe(false);
    expect(
      assistantAnswerSchema.safeParse({
        ...answer,
        result: { ...answer.result, rows: [{ nickname: { unsafe: true } }] },
      }).success,
    ).toBe(false);
  });
  it('중복 컬럼과 컬럼에 없는 행 값은 거부한다', () => {
    expect(
      assistantAnswerSchema.safeParse({
        ...answer,
        result: {
          ...answer.result,
          columns: [answer.result.columns[0], answer.result.columns[0]],
        },
      }).success,
    ).toBe(false);
    expect(
      assistantAnswerSchema.safeParse({
        ...answer,
        result: { ...answer.result, rows: [{ other: '멤버' }] },
      }).success,
    ).toBe(false);
  });
});

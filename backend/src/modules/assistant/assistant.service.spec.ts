import { ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import type { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
import type { LlmService } from '../ai/llm.service';
import type { LlmStructuredRequest } from '../ai/types/llm-request.type';

import type { AssistantScopeResolver } from './execution/assistant-scope.resolver';
import type { AnswerRenderer } from './rendering/answer-renderer';
import type { AssistantRepository } from './repositories/assistant.repository';
import type { ValidatedSqlQuery } from './sql/generated-sql.type';
import type { SqlQueryValidator } from './sql/sql-query.validator';
import { InvalidSqlQueryError, UnsupportedQuestionError } from './sql/sql-query.validator';
import { AssistantService } from './assistant.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const BAND_ID = '22222222-2222-4222-8222-222222222222';
const MEMBER_ID = '33333333-3333-4333-8333-333333333333';

const VALIDATED_QUERY: ValidatedSqlQuery = {
  intent: '밴드 멤버 수',
  sql: 'SELECT COUNT(bm.id)::int AS member_count FROM bands AS b JOIN band_members AS bm ON bm.band_id = b.id WHERE b.id = $1 AND b.deleted_at IS NULL LIMIT 1',
  parameters: [],
};

interface HarnessOptions {
  scopeError?: Error;
  validationResults?: Array<ValidatedSqlQuery | Error>;
  rows?: Array<Record<string, unknown>>;
  executionError?: Error;
  artistCandidates?: string[];
  artistLookupError?: Error;
}

function createHarness(options: HarnessOptions = {}) {
  const llmRequests: LlmStructuredRequest[] = [];
  const validationInputs: unknown[] = [];
  const scopeTransactions: unknown[] = [];
  const configuredTransactions: unknown[] = [];
  const executedTransactions: unknown[] = [];
  const executedQueries: ValidatedSqlQuery[] = [];
  const artistLookups: Array<{ bandId: string; value: string; question: string; tx: unknown }> = [];
  const internalTx = { kind: 'internal-tx' } as unknown as Prisma.TransactionClient;
  let transactionCount = 0;

  const llmService = {
    async generateStructured(request: LlmStructuredRequest) {
      llmRequests.push(request);

      return {
        parsed: { generated: llmRequests.length },
        providerName: 'gemini-primary',
        modelName: 'gemini-test',
        usage: { inputTokens: 100, outputTokens: 20 },
        latencyMs: 30,
      };
    },
  } as LlmService;

  const scopeResolver = {
    async resolve(userId: string, bandId: string, tx?: Prisma.TransactionClient) {
      scopeTransactions.push(tx);

      if (options.scopeError !== undefined) {
        throw options.scopeError;
      }

      return { userId, bandId, bandMemberId: MEMBER_ID };
    },
  } as AssistantScopeResolver;

  let validationIndex = 0;
  const validator = {
    async validate(input: unknown) {
      validationInputs.push(input);
      const result = options.validationResults?.[validationIndex] ?? VALIDATED_QUERY;
      validationIndex += 1;

      if (result instanceof Error) {
        throw result;
      }

      return result;
    },
  } as SqlQueryValidator;

  const repository: AssistantRepository = {
    async findArtistNameCandidates(bandId, value, question, tx) {
      artistLookups.push({ bandId, value, question, tx });
      if (options.artistLookupError) throw options.artistLookupError;
      return options.artistCandidates ?? [];
    },
    async findBandMemberByBandIdAndUserId() {
      return { id: MEMBER_ID };
    },
    async configureReadOnlyTransaction(tx) {
      configuredTransactions.push(tx);
    },
    async executeGeneratedQuery() {
      throw new Error('Service는 추가 결과 여부를 포함한 경로를 사용해야 합니다.');
    },
    async executeGeneratedQueryPage(sql, parameters, _bandId, tx) {
      executedTransactions.push(tx);
      executedQueries.push({ intent: VALIDATED_QUERY.intent, sql, parameters });

      if (options.executionError !== undefined) {
        throw options.executionError;
      }

      const rows = options.rows ?? [{ member_count: 3 }];
      return { rows: rows.slice(0, 50), hasMore: rows.length > 50 };
    },
  };

  const prisma = {
    async $transaction<T>(run: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
      transactionCount += 1;
      return run(internalTx);
    },
  } as PrismaService;

  const answerRenderer = {
    render(intent: string, rows: Array<Record<string, unknown>>) {
      return `${intent}: ${String(rows[0]?.member_count ?? 0)}`;
    },
  } as AnswerRenderer;

  return {
    service: new AssistantService(llmService, scopeResolver, repository, prisma, validator, answerRenderer),
    llmRequests,
    validationInputs,
    scopeTransactions,
    configuredTransactions,
    executedTransactions,
    executedQueries,
    artistLookups,
    getTransactionCount: () => transactionCount,
    internalTx,
  };
}

describe('AssistantService', () => {
  const artistQuery: ValidatedSqlQuery = {
    intent: '곡 조회',
    sql: 'SELECT so.title FROM bands b JOIN songs so ON so.band_id=b.id WHERE b.id=$1::uuid AND b.deleted_at IS NULL AND so.artist_name=$2 AND so.difficulty_level <= $3',
    parameters: ['B', 3],
    parameterTypes: ['TEXT', 'INTEGER'],
    resultMode: 'LIST',
  };

  it('현재 밴드의 유일한 아티스트 후보로 바인딩만 보정하고 원래 조건을 유지한다', async () => {
    const harness = createHarness({ validationResults: [artistQuery], artistCandidates: ['아티스트 B'], rows: [{ title: '베타' }] });
    const question = '아티스트 B의 난이도 3 이하 곡 제목만';
    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question });
    expect(answer.answerable).toBe(true);
    expect(harness.artistLookups).toEqual([{ bandId: BAND_ID, value: 'B', question, tx: harness.internalTx }]);
    expect(harness.executedQueries[0].sql).toBe(artistQuery.sql);
    expect(harness.executedQueries[0].parameters).toEqual(['아티스트 B', 3]);
    expect(artistQuery.parameters).toEqual(['B', 3]);
    expect(harness.configuredTransactions).toEqual([harness.internalTx, harness.internalTx]);
    expect(harness.getTransactionCount()).toBe(2);
    expect(harness.llmRequests).toHaveLength(1);
  });

  it('다중 후보는 정상 응답으로 선택을 안내하고 생성 SQL을 실행하지 않는다', async () => {
    const harness = createHarness({
      validationResults: [{ ...artistQuery, parameters: ['아티스트', 3] }],
      artistCandidates: ['아티스트 A', '아티스트 B'],
    });
    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question: '아티스트의 난이도 3 이하 곡' });
    expect(answer.answerable).toBe(false);
    expect(answer.kind).toBe('CLARIFICATION');
    expect(answer.result).toBeNull();
    expect(answer.summary).toBe('어떤 아티스트인가요? 밴드 곡 목록에 비슷한 이름이 2개 있어요.');
    // 후보를 누르면 그 이름을 따옴표로 넣은 질문을 그대로 다시 보낸다.
    expect(answer.clarification).toEqual({
      candidates: [
        { name: '아티스트 A', question: "'아티스트 A'의 난이도 3 이하 곡" },
        { name: '아티스트 B', question: "'아티스트 B'의 난이도 3 이하 곡" },
      ],
      hasMore: false,
    });
    expect(harness.executedQueries).toHaveLength(0);
    expect(harness.llmRequests).toHaveLength(1);
  });

  it('없는 이름은 원래 바인딩으로 빈 목록을 조회한다', async () => {
    const harness = createHarness({ validationResults: [artistQuery], artistCandidates: [], rows: [] });
    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question: 'B 곡 제목' });
    expect(answer.answerable).toBe(true);
    expect(answer.result?.rows).toEqual([]);
    expect(harness.executedQueries[0].parameters).toEqual(['B', 3]);
  });

  it('이름 lookup과 실제 조회에 외부 tx를 전달하고 내부 transaction을 열지 않는다', async () => {
    const harness = createHarness({ validationResults: [artistQuery], artistCandidates: ['아티스트 B'], rows: [{ title: '베타' }] });
    const tx = { kind: 'external' } as unknown as Prisma.TransactionClient;
    await harness.service.askAssistant(USER_ID, BAND_ID, { question: '아티스트 B 곡' }, tx);
    expect(harness.artistLookups[0].tx).toBe(tx);
    expect(harness.executedTransactions).toEqual([tx]);
    expect(harness.scopeTransactions).toEqual([tx]);
    expect(harness.configuredTransactions).toEqual([]);
    expect(harness.getTransactionCount()).toBe(0);
  });

  it('이름 lookup 장애는 503으로 반환하고 모델 재호출이나 결과 조회를 하지 않는다', async () => {
    const harness = createHarness({ validationResults: [artistQuery], artistLookupError: new Error('DB unavailable') });
    await expect(harness.service.askAssistant(USER_ID, BAND_ID, { question: 'B 곡' })).rejects.toThrow(ServiceUnavailableException);
    expect(harness.llmRequests).toHaveLength(1);
    expect(harness.executedQueries).toHaveLength(0);
  });

  it('권한 확인에 실패하면 후보 이름 조회도 수행하지 않는다', async () => {
    const harness = createHarness({ scopeError: new ForbiddenException('비멤버'), validationResults: [artistQuery] });
    await expect(harness.service.askAssistant(USER_ID, BAND_ID, { question: 'B 곡' })).rejects.toThrow(ForbiddenException);
    expect(harness.artistLookups).toHaveLength(0);
    expect(harness.llmRequests).toHaveLength(0);
  });

  it('자연어 질문을 생성·검증하고 같은 내부 transaction에서 read-only 설정과 조회를 실행한다', async () => {
    const harness = createHarness();

    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question: '밴드에 사람 몇 명 있어?' });

    expect(answer.answerable).toBe(true);
    expect(answer.summary).toBe('밴드 멤버 수: 3');
    expect(answer.result).toMatchObject({ entity: 'table', rows: [{ member_count: 3 }], hasMore: false });
    expect(harness.llmRequests).toHaveLength(1);
    expect(harness.configuredTransactions).toEqual([harness.internalTx]);
    expect(harness.executedTransactions).toEqual([harness.internalTx]);
    expect(harness.getTransactionCount()).toBe(1);
  });

  it('밴드 멤버가 아니면 LLM 호출 전에 차단한다', async () => {
    const harness = createHarness({ scopeError: new ForbiddenException('해당 밴드의 멤버가 아닙니다.') });

    await expect(harness.service.askAssistant(USER_ID, BAND_ID, { question: '멤버 수 알려줘' })).rejects.toThrow(ForbiddenException);
    expect(harness.llmRequests).toHaveLength(0);
  });

  it('51번째 행이 있으면 50행과 추가 결과 안내를 같은 응답에 반환한다', async () => {
    const rows = Array.from({ length: 51 }, (_, index) => ({ name: `멤버${index}` }));
    const harness = createHarness({
      rows,
      validationResults: [{ intent: '명단', sql: 'SELECT b.name FROM bands b WHERE b.id = $1', parameters: [], resultMode: 'LIST' }],
    });
    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question: '명단 모두 보여줘' });
    expect(answer.result?.rows).toHaveLength(50);
    expect(answer.result?.hasMore).toBe(true);
    // 초과 안내는 화면이 결과 아래에 한 번만 보여준다.
    expect(answer.summary).not.toContain('50건');
  });

  it('0행에도 컬럼과 빈 목록을 반환한다', async () => {
    const harness = createHarness({ rows: [] });
    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question: '멤버 수' });
    expect(answer.result?.rows).toEqual([]);
    expect(answer.result?.columns).toEqual([{ key: 'member_count', label: '멤버 수', format: 'plain' }]);
    expect(answer.result?.hasMore).toBe(false);
  });

  it('추천 질문은 모델을 호출하지 않고 고정 SQL을 같은 검증기로 확인해 실행한다', async () => {
    const harness = createHarness();

    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { presetId: 'next-schedule' });

    expect(harness.llmRequests).toHaveLength(0);
    expect(harness.validationInputs[0]).toMatchObject({ status: 'QUERY', intent: '다음 합주', resultMode: 'TOP_N' });
    expect(harness.executedQueries).toHaveLength(1);
    expect(answer.meta.usedLlm).toBe(false);
    expect(answer.kind).toBe('ANSWER');
  });

  it('없는 추천 질문 ID는 404로 실패한다', async () => {
    const harness = createHarness();

    await expect(harness.service.askAssistant(USER_ID, BAND_ID, { presetId: 'unknown' })).rejects.toThrow(NotFoundException);
    expect(harness.llmRequests).toHaveLength(0);
  });

  it('질문과 추천 질문이 모두 없으면 실패한다', async () => {
    const harness = createHarness();

    await expect(harness.service.askAssistant(USER_ID, BAND_ID, {})).rejects.toThrow('질문 또는 추천 질문 ID가 필요합니다.');
  });

  it('밴드 DB로 답할 수 없는 질문은 조회하지 않고 이유를 반환한다', async () => {
    const harness = createHarness({ validationResults: [new UnsupportedQuestionError('밴드 데이터에 날씨 정보가 없습니다.')] });

    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question: '오늘 날씨 어때?' });

    expect(answer.answerable).toBe(false);
    expect(answer.kind).toBe('UNSUPPORTED');
    expect(answer.summary).toBe('밴드 데이터에 날씨 정보가 없습니다.');
    expect(harness.executedTransactions).toHaveLength(0);
  });

  it('SQL 검증 실패 시 실패 사유를 주고 최대 두 번 재생성한다', async () => {
    const harness = createHarness({
      validationResults: [
        new InvalidSqlQueryError('SELECT_ONLY', 'SELECT만 허용합니다.'),
        new InvalidSqlQueryError('BAND_SCOPE_MISSING', '밴드 조건이 없습니다.'),
        VALIDATED_QUERY,
      ],
    });

    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question: '멤버 수 알려줘' });

    expect(answer.answerable).toBe(true);
    expect(harness.llmRequests).toHaveLength(3);
    expect(harness.llmRequests[1].systemInstruction).toContain('SELECT_ONLY');
    // 두 번째 재생성에도 첫 번째 위반을 남겨 이미 고친 규칙을 다시 어기지 않게 한다.
    expect(harness.llmRequests[2].systemInstruction).toContain('1차 시도:\nSELECT_ONLY');
    expect(harness.llmRequests[2].systemInstruction).toContain('2차 시도:\nBAND_SCOPE_MISSING');
    expect(answer.meta.inputTokens).toBe(300);
    expect(answer.meta.outputTokens).toBe(60);
  });

  it('세 번 모두 SQL 검증에 실패하면 장애가 아니라 질문을 바꿔 달라는 응답을 준다', async () => {
    const failure = new InvalidSqlQueryError('SELECT_ONLY', 'SELECT만 허용합니다.');
    const harness = createHarness({ validationResults: [failure, failure, failure] });

    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question: '멤버 수 알려줘' });

    expect(answer).toMatchObject({ answerable: false, kind: 'REPHRASE', result: null, clarification: null });
    expect(answer.meta.inputTokens).toBe(300);
    expect(harness.llmRequests).toHaveLength(3);
    expect(harness.executedQueries).toHaveLength(0);
  });

  it('모델 호출 장애는 질문을 바꿔도 해결되지 않으므로 503으로 둔다', async () => {
    const harness = createHarness();
    harness.service['llmService'].generateStructured = async () => {
      throw new ServiceUnavailableException('Gemini 호출에 실패했습니다.');
    };

    await expect(harness.service.askAssistant(USER_ID, BAND_ID, { question: '멤버 수 알려줘' })).rejects.toThrow(ServiceUnavailableException);
  });

  it('외부 transaction이 있으면 새 transaction을 열지 않고 그대로 전달한다', async () => {
    const harness = createHarness();
    const externalTx = { kind: 'external-tx' } as unknown as Prisma.TransactionClient;

    await harness.service.askAssistant(USER_ID, BAND_ID, { question: '멤버 수 알려줘' }, externalTx);

    expect(harness.getTransactionCount()).toBe(0);
    expect(harness.scopeTransactions).toEqual([externalTx]);
    expect(harness.configuredTransactions).toHaveLength(0);
    expect(harness.executedTransactions).toEqual([externalTx]);
  });

  it('검증된 SQL 실행 실패는 사용자용 503으로 변환한다', async () => {
    const harness = createHarness({ executionError: new Error('database error') });

    await expect(harness.service.askAssistant(USER_ID, BAND_ID, { question: '멤버 수 알려줘' })).rejects.toThrow(ServiceUnavailableException);
  });
});

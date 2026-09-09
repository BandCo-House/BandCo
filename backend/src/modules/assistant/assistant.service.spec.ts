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
}

function createHarness(options: HarnessOptions = {}) {
  const llmRequests: LlmStructuredRequest[] = [];
  const validationInputs: unknown[] = [];
  const scopeTransactions: unknown[] = [];
  const configuredTransactions: unknown[] = [];
  const executedTransactions: unknown[] = [];
  const executedQueries: ValidatedSqlQuery[] = [];
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
    async findBandMemberByBandIdAndUserId() {
      return { id: MEMBER_ID };
    },
    async configureReadOnlyTransaction(tx) {
      configuredTransactions.push(tx);
    },
    async executeGeneratedQuery(sql, parameters, _bandId, tx) {
      executedTransactions.push(tx);
      executedQueries.push({ intent: VALIDATED_QUERY.intent, sql, parameters });

      if (options.executionError !== undefined) {
        throw options.executionError;
      }

      return options.rows ?? [{ member_count: 3 }];
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
    getTransactionCount: () => transactionCount,
    internalTx,
  };
}

describe('AssistantService', () => {
  it('자연어 질문을 생성·검증하고 같은 내부 transaction에서 read-only 설정과 조회를 실행한다', async () => {
    const harness = createHarness();

    const answer = await harness.service.askAssistant(USER_ID, BAND_ID, { question: '밴드에 사람 몇 명 있어?' });

    expect(answer.answerable).toBe(true);
    expect(answer.summary).toBe('밴드 멤버 수: 3');
    expect(answer.result).toBeNull();
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

  it('추천 질문 ID를 기존 문장으로 바꿔 같은 Text-to-SQL 경로로 실행한다', async () => {
    const harness = createHarness();

    await harness.service.askAssistant(USER_ID, BAND_ID, { presetId: 'next-schedule' });

    expect(harness.llmRequests[0].userMessage).toBe('다음 합주 일정이 언제야?');
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
    expect(harness.llmRequests[2].systemInstruction).toContain('BAND_SCOPE_MISSING');
    expect(answer.meta.inputTokens).toBe(300);
    expect(answer.meta.outputTokens).toBe(60);
  });

  it('세 번 모두 SQL 검증에 실패하면 503을 반환한다', async () => {
    const failure = new InvalidSqlQueryError('SELECT_ONLY', 'SELECT만 허용합니다.');
    const harness = createHarness({ validationResults: [failure, failure, failure] });

    await expect(harness.service.askAssistant(USER_ID, BAND_ID, { question: '멤버 수 알려줘' })).rejects.toThrow(ServiceUnavailableException);
    expect(harness.llmRequests).toHaveLength(3);
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

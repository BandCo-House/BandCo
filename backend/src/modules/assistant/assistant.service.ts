import { BadRequestException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
import { LlmService } from '../ai/llm.service';

import { type AskAssistantInput, MAX_TURN_INDEX } from './dto/ask-assistant.dto';
import { AssistantScopeResolver } from './execution/assistant-scope.resolver';
import { ASSISTANT_PRESETS, type AssistantPreset, findPresetById } from './query-plan/query-plan.presets';
import { AnswerRenderer } from './rendering/answer-renderer';
import { mapSqlResult } from './rendering/sql-result.mapper';
import { ASSISTANT_REPOSITORY, type AssistantRepository } from './repositories/assistant.repository';
import type { ValidatedSqlQuery } from './sql/generated-sql.type';
import { createCandidateQuestion, readArtistNameBindings, resolveArtistName } from './sql/sql-artist-name';
import { createSqlGenerationSystemInstruction } from './sql/sql-generation.prompt';
import { SQL_GENERATION_RESPONSE_SCHEMA } from './sql/sql-generation.schema';
import { InvalidSqlQueryError, SqlQueryValidator, UnsupportedQuestionError } from './sql/sql-query.validator';
import { createSqlRepairInstruction, getSqlCountUnit } from './sql/sql-query-context';
import type { AssistantQueryLogEntry } from './telemetry/assistant-query-log.type';
import { type AssistantQueryBucketName, type AssistantQuerySignal, detectSignals, resolveExecutedBucket } from './telemetry/assistant-query-signal';
import type { AssistantAnswer, AssistantClarification, AssistantQueryMeta } from './types/assistant-answer.type';
import type { AssistantScope } from './types/assistant-scope.type';

/** 최초 생성 이후 검증 실패 SQL을 다시 만들 수 있는 횟수 */
const MAX_SQL_REGENERATIONS = 2;

interface GeneratedQuery {
  status: 'QUERY';
  query: ValidatedSqlQuery;
  meta: AssistantQueryMeta;
  validationFailures: number;
  /** 허용 목록 밖을 건드린 위반 코드. 의미 위반과 섞이면 질문이 경계를 시험했는지 볼 수 없다. */
  policyViolations: string[];
}

interface UnsupportedQuery {
  status: 'UNSUPPORTED';
  reason: string;
  meta: AssistantQueryMeta;
  validationFailures: number;
  policyViolations: string[];
}

interface ClarificationQuery extends Omit<UnsupportedQuery, 'status'> {
  status: 'CLARIFICATION';
  clarification: AssistantClarification;
}

type SqlGenerationResult = GeneratedQuery | UnsupportedQuery | ClarificationQuery;

const REPHRASE_SUMMARY = '질문을 정확히 이해하지 못했어요. 누구·언제·무엇을 넣어 조금 다르게 물어봐 주세요.';

/**
 * 재생성까지 안전한 SQL을 만들지 못했다. 평가 도구는 이 예외를 생성 실패로 집계하고,
 * 사용자 응답에서는 장애가 아니라 질문을 바꿔 달라는 안내로 바꾼다.
 */
/**
 * 모델 호출·이름 확인처럼 재생성으로 풀리지 않는 장애다. 원인 예외를 그대로 다시 던져
 * 사용자 응답과 상태 코드는 바꾸지 않고, 그때까지 쓴 토큰만 측정에 남기기 위해 감싼다.
 */
class SqlGenerationFailedError extends Error {
  constructor(
    readonly cause: unknown,
    readonly meta: AssistantQueryMeta,
    readonly validationFailures: number,
    readonly policyViolations: string[],
  ) {
    super('조회 SQL 생성 중 장애가 발생했습니다.');
    this.name = 'SqlGenerationFailedError';
  }
}

class SqlGenerationExhaustedError extends ServiceUnavailableException {
  constructor(
    readonly meta: AssistantQueryMeta,
    readonly validationFailures: number,
    readonly policyViolations: string[],
  ) {
    super('안전한 조회 SQL을 만들지 못했습니다. 질문을 조금 다르게 표현해 주세요.');
  }
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly scopeResolver: AssistantScopeResolver,
    @Inject(ASSISTANT_REPOSITORY) private readonly repository: AssistantRepository,
    private readonly prisma: PrismaService,
    private readonly validator: SqlQueryValidator,
    private readonly answerRenderer: AnswerRenderer,
  ) {}

  /** 화면에 보여줄 추천 질문 목록을 반환한다. */
  getPresets(): { id: string; label: string; question: string; followUps: string[] }[] {
    return ASSISTANT_PRESETS.map(preset => ({ id: preset.id, label: preset.label, question: preset.question, followUps: preset.followUps }));
  }

  /**
   * 자연어 질문을 SQL로 바꾸고, 검증을 통과한 SELECT만 읽기 전용 transaction에서 실행한다.
   * 권한 확인은 LLM 호출보다 먼저 수행해 비멤버 요청에는 비용이 발생하지 않게 한다.
   */
  async askAssistant(userId: string, bandId: string, input: AskAssistantInput, tx?: Prisma.TransactionClient): Promise<AssistantAnswer> {
    const preset = this.resolvePreset(input);
    const startedAt = Date.now();
    const scope = await this.scopeResolver.resolve(userId, bandId, tx);
    let generated: SqlGenerationResult;

    try {
      generated = preset ? await this.createPresetQuery(preset) : await this.generateSqlFromQuestion(input.question ?? '', new Date(), bandId, tx);
    } catch (error) {
      if (error instanceof SqlGenerationFailedError) {
        // 장애도 실패율 분모에 들어가야 하고, 이미 쓴 토큰이 비용 집계에서 빠지면 안 된다.
        await this.recordQuery({
          scope,
          input,
          outcome: 'generation_failed',
          bucket: 'INFRA',
          execOk: false,
          latencyMs: Date.now() - startedAt,
          meta: error.meta,
          validationFailures: error.validationFailures,
          policyViolations: error.policyViolations,
        });

        throw error.cause;
      }

      if (!(error instanceof SqlGenerationExhaustedError)) throw error;
      await this.recordQuery({
        scope,
        input,
        outcome: 'rephrase_required',
        bucket: 'REPHRASE',
        execOk: false,
        latencyMs: Date.now() - startedAt,
        meta: error.meta,
        validationFailures: error.validationFailures,
        policyViolations: error.policyViolations,
      });

      return {
        answerable: false,
        kind: 'REPHRASE',
        summary: REPHRASE_SUMMARY,
        result: null,
        clarification: null,
        meta: { ...error.meta, latencyMs: Date.now() - startedAt },
      };
    }

    if (generated.status !== 'QUERY') {
      await this.recordQuery({
        scope,
        input,
        outcome: generated.status === 'CLARIFICATION' ? 'clarification_required' : 'unsupported',
        bucket: generated.status === 'CLARIFICATION' ? 'CLARIFICATION' : 'UNSUPPORTED',
        execOk: false,
        latencyMs: Date.now() - startedAt,
        meta: generated.meta,
        validationFailures: generated.validationFailures,
        policyViolations: generated.policyViolations,
      });

      return {
        answerable: false,
        kind: generated.status,
        summary: generated.reason,
        result: null,
        clarification: generated.status === 'CLARIFICATION' ? generated.clarification : null,
        meta: { ...generated.meta, latencyMs: Date.now() - startedAt },
      };
    }

    let page;
    let result;

    try {
      page = await this.executeQuery(bandId, generated.query, tx);
      result = await mapSqlResult(generated.query, page);
    } catch (error) {
      this.logger.warn(`검증된 SQL 실행에 실패했습니다: ${toMessage(error)}`);
      await this.recordQuery({
        scope,
        input,
        outcome: 'execution_failed',
        bucket: 'INFRA',
        execOk: false,
        latencyMs: Date.now() - startedAt,
        meta: generated.meta,
        query: generated.query,
        validationFailures: generated.validationFailures,
        policyViolations: generated.policyViolations,
      });
      throw new ServiceUnavailableException('생성한 조회를 실행하지 못했습니다. 질문을 조금 다르게 표현해 주세요.');
    }

    // 검증·실행이 끝났을 뿐이다. 질문에 답했는지는 결정론으로 알 수 없어 의심 신호만 붙인다.
    const signals = detectSignals({
      resultMode: generated.query.resultMode,
      page,
      question: input.question ?? null,
      generatedSql: generated.query.sql,
      parameterTypes: generated.query.parameterTypes ?? [],
      validationFailures: generated.validationFailures,
      policyViolations: generated.policyViolations,
    });

    await this.recordQuery({
      scope,
      input,
      outcome: 'success',
      bucket: resolveExecutedBucket(signals),
      execOk: true,
      latencyMs: Date.now() - startedAt,
      meta: generated.meta,
      query: generated.query,
      validationFailures: generated.validationFailures,
      policyViolations: generated.policyViolations,
      signals,
      rowCount: page.rows.length,
      hasMore: page.hasMore,
    });

    // 50건 초과 안내는 화면이 결과 아래에 한 번만 보여준다.
    return {
      answerable: true,
      kind: 'ANSWER',
      summary: this.answerRenderer.render(generated.query.intent, page.rows, generated.query.resultMode),
      result,
      clarification: null,
      meta: { ...generated.meta, latencyMs: Date.now() - startedAt },
    };
  }

  /** 자유 질문이면 undefined, 추천 질문이면 그 정의를 반환한다. */
  private resolvePreset(input: AskAssistantInput): AssistantPreset | undefined {
    if (input.question === undefined && input.presetId === undefined) {
      throw new BadRequestException('질문 또는 추천 질문 ID가 필요합니다.');
    }

    if (input.presetId === undefined) {
      return undefined;
    }

    const preset = findPresetById(input.presetId);

    if (preset === undefined) {
      throw new NotFoundException('요청한 추천 질문을 찾을 수 없습니다.');
    }

    return preset;
  }

  /** 추천 질문은 모델을 호출하지 않고 고정 SQL을 같은 검증기로 확인해 실행한다. */
  private async createPresetQuery(preset: AssistantPreset): Promise<GeneratedQuery> {
    return {
      status: 'QUERY',
      query: await this.validator.validate(preset.createQuery(new Date())),
      meta: { providerName: null, modelName: null, usedLlm: false, inputTokens: 0, outputTokens: 0, latencyMs: 0 },
      validationFailures: 0,
      policyViolations: [],
    };
  }

  /**
   * LLM SQL을 AST로 검증하고 형식이 잘못된 경우 실패 이유를 주어 최대 두 번 재생성한다.
   * 재생성에는 모든 시도의 위반과 직전 SQL을 함께 준다. 지원 범위 밖 질문은 같은 결과가 반복되므로 재생성하지 않는다.
   */
  private async generateSqlFromQuestion(question: string, now: Date, bandId: string, tx?: Prisma.TransactionClient): Promise<SqlGenerationResult> {
    const baseInstruction = createSqlGenerationSystemInstruction(now, question);
    const failures: string[] = [];
    // 허용 목록 밖을 건드린 코드만 따로 모은다. 재생성 횟수 하나에 합치면 나중에 구분할 수 없다.
    const policyViolations: string[] = [];
    let previousSql = '';
    let inputTokens = 0;
    let outputTokens = 0;
    // 장애가 났을 때 그때까지 쓴 시도 횟수를 측정에 남긴다.
    let attemptsUsed = 0;

    try {
      for (let attempt = 0; attempt <= MAX_SQL_REGENERATIONS; attempt += 1) {
        attemptsUsed = attempt;
        const response = await this.llmService.generateStructured({
          systemInstruction:
            attempt === 0
              ? baseInstruction
              : `${baseInstruction}\n\n${createSqlRepairInstruction(failures, previousSql)}\n규칙에 맞게 다시 생성한다.`,
          userMessage: question,
          responseSchema: SQL_GENERATION_RESPONSE_SCHEMA,
          maxOutputTokens: 1_500,
        });

        inputTokens += response.usage?.inputTokens ?? 0;
        outputTokens += response.usage?.outputTokens ?? 0;

        const meta: AssistantQueryMeta = {
          providerName: response.providerName,
          modelName: response.modelName,
          usedLlm: true,
          inputTokens,
          outputTokens,
          latencyMs: response.latencyMs,
        };

        try {
          const query = await this.validator.validate(response.parsed, getSqlCountUnit(question));
          const resolved = await this.resolveQueryArtistNames(query, question, bandId, tx);
          if ('reason' in resolved) {
            return {
              status: 'CLARIFICATION',
              reason: resolved.reason,
              clarification: resolved.clarification,
              meta,
              validationFailures: attempt,
              policyViolations,
            };
          }
          return {
            status: 'QUERY',
            query: resolved,
            meta,
            validationFailures: attempt,
            policyViolations,
          };
        } catch (error) {
          if (error instanceof UnsupportedQuestionError) {
            return {
              status: 'UNSUPPORTED',
              reason: error.reason,
              meta,
              validationFailures: attempt,
              policyViolations,
            };
          }

          if (error instanceof InvalidSqlQueryError) {
            // 클래스가 아니라 policyCodes를 읽는다. 여러 위반이 합쳐지면 클래스는 평범한 오류가 된다.
            policyViolations.push(...error.policyCodes);
            failures.push(error.message);
            previousSql = readGeneratedSql(response.parsed);
            this.logger.warn(`SQL 검증에 실패해 재생성합니다: ${error.message}`);
            continue;
          }

          throw error;
        }
      }
    } catch (error) {
      // 모델 호출·이름 확인 장애는 재생성으로 풀리지 않는다. 원인은 그대로 올리고 토큰만 측정에 남긴다.
      throw new SqlGenerationFailedError(
        error,
        { providerName: null, modelName: null, usedLlm: true, inputTokens, outputTokens, latencyMs: 0 },
        attemptsUsed,
        policyViolations,
      );
    }

    throw new SqlGenerationExhaustedError(
      {
        providerName: null,
        modelName: null,
        usedLlm: true,
        inputTokens,
        outputTokens,
        latencyMs: 0,
      },
      MAX_SQL_REGENERATIONS + 1,
      policyViolations,
    );
  }

  /** SQL은 보존하고 아티스트 equality의 바인딩만 실제 밴드 이름으로 확인한다. */
  private async resolveQueryArtistNames(
    query: ValidatedSqlQuery,
    question: string,
    bandId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<ValidatedSqlQuery | { reason: string; clarification: AssistantClarification }> {
    const bindings = await readArtistNameBindings(query);
    if (bindings.length === 0) return query;
    const run = async (client: Prisma.TransactionClient): Promise<ValidatedSqlQuery | { reason: string; clarification: AssistantClarification }> => {
      const parameters = [...query.parameters];
      for (const binding of bindings) {
        const candidates = await this.repository.findArtistNameCandidates(bandId, binding.value, question, client);
        const resolved = resolveArtistName(binding.value, question, candidates);
        if ('candidates' in resolved) {
          return {
            // 후보 이름은 clarification으로 따로 보내 화면이 선택지로 보여준다. 문장에서 다시 나열하지 않는다.
            reason: `어떤 아티스트인가요? 밴드 곡 목록에 비슷한 이름이 ${resolved.hasMore ? `${resolved.candidates.length}개 넘게` : `${resolved.candidates.length}개`} 있어요.`,
            clarification: {
              candidates: resolved.candidates.map(name => ({ name, question: createCandidateQuestion(question, binding.value, name) })),
              hasMore: resolved.hasMore,
            },
          };
        }
        parameters[binding.position - 2] = resolved.name;
      }
      return { ...query, parameters };
    };
    try {
      if (tx) return await run(tx);
      return await this.prisma.$transaction(async client => {
        await this.repository.configureReadOnlyTransaction(client);
        return run(client);
      });
    } catch (error) {
      this.logger.warn(`아티스트 이름 확인에 실패했습니다: ${toMessage(error)}`);
      throw new ServiceUnavailableException('아티스트 이름을 확인하지 못했습니다. 잠시 후 다시 질문해 주세요.');
    }
  }

  /** 내부 transaction은 read-only로 설정하고, 외부 transaction은 호출자가 정한 속성을 유지한다. */
  private async executeQuery(bandId: string, query: ValidatedSqlQuery, tx?: Prisma.TransactionClient) {
    if (tx !== undefined) {
      return this.repository.executeGeneratedQueryPage(query.sql, query.parameters, bandId, tx);
    }

    return this.prisma.$transaction(async internalTx => {
      await this.repository.configureReadOnlyTransaction(internalTx);
      return this.repository.executeGeneratedQueryPage(query.sql, query.parameters, bandId, internalTx);
    });
  }

  /**
   * 조회 한 건을 측정 기록으로 남긴다. 값 파라미터는 담지 않는다.
   *
   * ★stdout 로그를 함께 남기는 이유: CloudWatch Logs Insights에 이미 걸어 둔 질의가 있고,
   *   DB 기록이 꺼져도 오류 추적은 계속돼야 한다. 두 경로는 같은 사실을 서로 다른 수명으로 담는다.
   * ★기록 실패가 조회 결과를 되돌리지 않는다. 측정이 제품을 막으면 측정을 끄게 된다.
   */
  private async recordQuery(record: QueryRecord): Promise<void> {
    const signals = record.signals ?? [];

    this.logger.log(
      JSON.stringify({
        event: 'assistant.text_to_sql',
        userId: record.scope.userId,
        bandId: record.scope.bandId,
        sessionId: record.input.sessionId ?? null,
        turnIndex: record.input.turnIndex ?? null,
        presetId: record.input.presetId ?? null,
        question: record.input.question ?? null,
        intent: record.query?.intent ?? null,
        sql: record.query?.sql ?? null,
        validationFailures: record.validationFailures,
        policyViolations: record.policyViolations,
        outcome: record.outcome,
        execOk: record.execOk,
        bucket: record.bucket,
        signals,
        rowCount: record.rowCount ?? 0,
        latencyMs: record.latencyMs,
      }),
    );

    if (!isQueryLogEnabled()) return;

    const entry: AssistantQueryLogEntry = {
      bandId: record.scope.bandId,
      userId: record.scope.userId,
      sessionId: record.input.sessionId ?? null,
      turnIndex: clampTurnIndex(record.input.turnIndex),
      presetId: record.input.presetId ?? null,
      question: record.input.question ?? null,
      intent: record.query?.intent ?? null,
      generatedSql: record.query?.sql ?? null,
      resultMode: record.query?.resultMode ?? null,
      execOk: record.execOk,
      // 질문에 답했는지는 사람·모델 판정이 붙을 때 채운다.
      answered: null,
      bucket: record.bucket,
      outcome: record.outcome,
      signals,
      rowCount: record.rowCount ?? 0,
      hasMore: record.hasMore ?? false,
      validationFailures: record.validationFailures,
      policyViolations: record.policyViolations,
      latencyMs: record.latencyMs,
      usedLlm: record.meta.usedLlm,
      modelName: record.meta.modelName,
      inputTokens: record.meta.inputTokens,
      outputTokens: record.meta.outputTokens,
    };

    try {
      await this.repository.recordQueryLog(entry);
    } catch (error) {
      this.logger.warn(`질의 측정 기록에 실패했습니다: ${toMessage(error)}`);
    }
  }
}

/** recordQuery 한 번에 필요한 사실. 경로마다 아는 범위가 달라 선택값으로 둔다. */
interface QueryRecord {
  scope: AssistantScope;
  input: AskAssistantInput;
  outcome: string;
  bucket: AssistantQueryBucketName;
  execOk: boolean;
  latencyMs: number;
  meta: AssistantQueryMeta;
  validationFailures: number;
  policyViolations: string[];
  query?: ValidatedSqlQuery;
  signals?: AssistantQuerySignal[];
  rowCount?: number;
  hasMore?: boolean;
}

/**
 * 측정 기록을 끌 수 있게 둔다. 호출 시점에 읽어 재배포 없이 바꿀 수 있다.
 * 기본값은 켜짐이며, 끄면 stdout 로그만 남는다.
 */
function isQueryLogEnabled(): boolean {
  return process.env.ASSISTANT_QUERY_LOG_ENABLED !== 'false';
}

/** 긴 대화의 턴 순서를 상한으로 깎는다. 측정 필드 때문에 조회를 거절하지 않는다. */
function clampTurnIndex(turnIndex: number | undefined): number | null {
  return turnIndex === undefined ? null : Math.min(turnIndex, MAX_TURN_INDEX);
}

/** 알 수 없는 실행 오류를 운영 로그에서 확인할 수 있는 문자열로 만든다. */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 검증에 실패한 응답의 SQL을 다음 재생성의 수정 대상으로 사용한다. */
function readGeneratedSql(parsed: unknown): string {
  return typeof parsed === 'object' && parsed !== null && 'sql' in parsed && typeof parsed.sql === 'string' ? parsed.sql : '';
}

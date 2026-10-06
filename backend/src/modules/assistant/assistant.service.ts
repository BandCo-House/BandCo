import { BadRequestException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
import { LlmService } from '../ai/llm.service';

import type { AskAssistantInput } from './dto/ask-assistant.dto';
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
import type { AssistantAnswer, AssistantClarification, AssistantQueryMeta } from './types/assistant-answer.type';
import type { AssistantScope } from './types/assistant-scope.type';

/** 최초 생성 이후 검증 실패 SQL을 다시 만들 수 있는 횟수 */
const MAX_SQL_REGENERATIONS = 2;

interface GeneratedQuery {
  status: 'QUERY';
  query: ValidatedSqlQuery;
  meta: AssistantQueryMeta;
  validationFailures: number;
}

interface UnsupportedQuery {
  status: 'UNSUPPORTED';
  reason: string;
  meta: AssistantQueryMeta;
  validationFailures: number;
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
class SqlGenerationExhaustedError extends ServiceUnavailableException {
  constructor(readonly meta: AssistantQueryMeta) {
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
  getPresets(): { id: string; label: string; question: string }[] {
    return ASSISTANT_PRESETS.map(preset => ({ id: preset.id, label: preset.label, question: preset.question }));
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
      if (!(error instanceof SqlGenerationExhaustedError)) throw error;
      this.logger.log(
        JSON.stringify({
          event: 'assistant.text_to_sql',
          userId: scope.userId,
          bandId: scope.bandId,
          question: input.question ?? null,
          outcome: 'rephrase_required',
        }),
      );

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
      this.logQueryAudit(
        scope,
        input,
        generated,
        generated.status === 'CLARIFICATION' ? 'clarification_required' : 'unsupported',
        0,
        Date.now() - startedAt,
      );

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
      this.logQueryAudit(scope, input, generated, 'execution_failed', 0, Date.now() - startedAt);
      throw new ServiceUnavailableException('생성한 조회를 실행하지 못했습니다. 질문을 조금 다르게 표현해 주세요.');
    }

    this.logQueryAudit(scope, input, generated, 'success', page.rows.length, Date.now() - startedAt);

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
    };
  }

  /**
   * LLM SQL을 AST로 검증하고 형식이 잘못된 경우 실패 이유를 주어 최대 두 번 재생성한다.
   * 재생성에는 모든 시도의 위반과 직전 SQL을 함께 준다. 지원 범위 밖 질문은 같은 결과가 반복되므로 재생성하지 않는다.
   */
  private async generateSqlFromQuestion(question: string, now: Date, bandId: string, tx?: Prisma.TransactionClient): Promise<SqlGenerationResult> {
    const baseInstruction = createSqlGenerationSystemInstruction(now, question);
    const failures: string[] = [];
    let previousSql = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for (let attempt = 0; attempt <= MAX_SQL_REGENERATIONS; attempt += 1) {
      const response = await this.llmService.generateStructured({
        systemInstruction:
          attempt === 0 ? baseInstruction : `${baseInstruction}\n\n${createSqlRepairInstruction(failures, previousSql)}\n규칙에 맞게 다시 생성한다.`,
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
          return { status: 'CLARIFICATION', reason: resolved.reason, clarification: resolved.clarification, meta, validationFailures: attempt };
        }
        return {
          status: 'QUERY',
          query: resolved,
          meta,
          validationFailures: attempt,
        };
      } catch (error) {
        if (error instanceof UnsupportedQuestionError) {
          return {
            status: 'UNSUPPORTED',
            reason: error.reason,
            meta,
            validationFailures: attempt,
          };
        }

        if (error instanceof InvalidSqlQueryError) {
          failures.push(error.message);
          previousSql = readGeneratedSql(response.parsed);
          this.logger.warn(`SQL 검증에 실패해 재생성합니다: ${error.message}`);
          continue;
        }

        throw error;
      }
    }

    throw new SqlGenerationExhaustedError({
      providerName: null,
      modelName: null,
      usedLlm: true,
      inputTokens,
      outputTokens,
      latencyMs: 0,
    });
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
            reason: `어떤 아티스트인가요? 밴드에 비슷한 이름이 ${resolved.hasMore ? `${resolved.candidates.length}개 넘게` : `${resolved.candidates.length}개`} 있어요.`,
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

  /** 실험 비교에 필요한 생성 SQL과 검증 실패 횟수를 값 파라미터 없이 기록한다. */
  private logQueryAudit(
    scope: AssistantScope,
    input: AskAssistantInput,
    generated: SqlGenerationResult,
    outcome: string,
    rowCount: number,
    latencyMs: number,
  ): void {
    this.logger.log(
      JSON.stringify({
        event: 'assistant.text_to_sql',
        userId: scope.userId,
        bandId: scope.bandId,
        presetId: input.presetId ?? null,
        question: input.question ?? null,
        intent: generated.status === 'QUERY' ? generated.query.intent : null,
        sql: generated.status === 'QUERY' ? generated.query.sql : null,
        validationFailures: generated.validationFailures,
        outcome,
        rowCount,
        latencyMs,
      }),
    );
  }
}

/** 알 수 없는 실행 오류를 운영 로그에서 확인할 수 있는 문자열로 만든다. */
function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** 검증에 실패한 응답의 SQL을 다음 재생성의 수정 대상으로 사용한다. */
function readGeneratedSql(parsed: unknown): string {
  return typeof parsed === 'object' && parsed !== null && 'sql' in parsed && typeof parsed.sql === 'string' ? parsed.sql : '';
}

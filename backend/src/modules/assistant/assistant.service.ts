import { BadRequestException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma';
import type { Prisma } from '../../generated/prisma';
import { LlmService } from '../ai/llm.service';

import type { AskAssistantInput } from './dto/ask-assistant.dto';
import { AssistantScopeResolver } from './execution/assistant-scope.resolver';
import { ASSISTANT_PRESETS, findPresetById } from './query-plan/query-plan.presets';
import { AnswerRenderer } from './rendering/answer-renderer';
import { ASSISTANT_REPOSITORY, type AssistantRepository } from './repositories/assistant.repository';
import type { ValidatedSqlQuery } from './sql/generated-sql.type';
import { createSqlGenerationSystemInstruction } from './sql/sql-generation.prompt';
import { SQL_GENERATION_RESPONSE_SCHEMA } from './sql/sql-generation.schema';
import { InvalidSqlQueryError, SqlQueryValidator, UnsupportedQuestionError } from './sql/sql-query.validator';
import type { AssistantAnswer, AssistantQueryMeta } from './types/assistant-answer.type';
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

type SqlGenerationResult = GeneratedQuery | UnsupportedQuery;

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
  getPresets(): { id: string; question: string }[] {
    return ASSISTANT_PRESETS.map(preset => ({ id: preset.id, question: preset.question }));
  }

  /**
   * 자연어 질문을 SQL로 바꾸고, 검증을 통과한 SELECT만 읽기 전용 transaction에서 실행한다.
   * 권한 확인은 LLM 호출보다 먼저 수행해 비멤버 요청에는 비용이 발생하지 않게 한다.
   */
  async askAssistant(userId: string, bandId: string, input: AskAssistantInput, tx?: Prisma.TransactionClient): Promise<AssistantAnswer> {
    const question = this.resolveQuestion(input);
    const startedAt = Date.now();
    const scope = await this.scopeResolver.resolve(userId, bandId, tx);
    const generated = await this.generateSqlFromQuestion(question, new Date());

    if (generated.status === 'UNSUPPORTED') {
      this.logQueryAudit(scope, input, generated, 'unsupported', 0, Date.now() - startedAt);

      return {
        answerable: false,
        summary: generated.reason,
        result: null,
        meta: { ...generated.meta, latencyMs: Date.now() - startedAt },
      };
    }

    let rows;

    try {
      rows = await this.executeQuery(bandId, generated.query, tx);
    } catch (error) {
      this.logger.warn(`검증된 SQL 실행에 실패했습니다: ${toMessage(error)}`);
      this.logQueryAudit(scope, input, generated, 'execution_failed', 0, Date.now() - startedAt);
      throw new ServiceUnavailableException('생성한 조회를 실행하지 못했습니다. 질문을 조금 다르게 표현해 주세요.');
    }

    this.logQueryAudit(scope, input, generated, 'success', rows.length, Date.now() - startedAt);

    return {
      answerable: true,
      summary: this.answerRenderer.render(generated.query.intent, rows),
      result: null,
      meta: { ...generated.meta, latencyMs: Date.now() - startedAt },
    };
  }

  /** 자연어 또는 추천 질문 ID를 실제 질문 문장으로 정규화한다. */
  private resolveQuestion(input: AskAssistantInput): string {
    if (input.question === undefined && input.presetId === undefined) {
      throw new BadRequestException('질문 또는 추천 질문 ID가 필요합니다.');
    }

    if (input.presetId === undefined) {
      return input.question ?? '';
    }

    const preset = findPresetById(input.presetId);

    if (preset === undefined) {
      throw new NotFoundException('요청한 추천 질문을 찾을 수 없습니다.');
    }

    return preset.question;
  }

  /**
   * LLM SQL을 AST로 검증하고 형식이 잘못된 경우 실패 이유를 주어 최대 두 번 재생성한다.
   * 지원 범위 밖 질문은 같은 결과가 반복되므로 재생성하지 않는다.
   */
  private async generateSqlFromQuestion(question: string, now: Date): Promise<SqlGenerationResult> {
    const baseInstruction = createSqlGenerationSystemInstruction(now);
    let lastFailure = '';
    let inputTokens = 0;
    let outputTokens = 0;

    for (let attempt = 0; attempt <= MAX_SQL_REGENERATIONS; attempt += 1) {
      const response = await this.llmService.generateStructured({
        systemInstruction: attempt === 0 ? baseInstruction : `${baseInstruction}\n\n# 직전 검증 실패\n${lastFailure}\n규칙에 맞게 다시 생성한다.`,
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
        return {
          status: 'QUERY',
          query: await this.validator.validate(response.parsed),
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
          lastFailure = error.message;
          this.logger.warn(`SQL 검증에 실패해 재생성합니다: ${error.message}`);
          continue;
        }

        throw error;
      }
    }

    throw new ServiceUnavailableException('안전한 조회 SQL을 만들지 못했습니다. 질문을 조금 다르게 표현해 주세요.');
  }

  /** 내부 transaction은 read-only로 설정하고, 외부 transaction은 호출자가 정한 속성을 유지한다. */
  private async executeQuery(bandId: string, query: ValidatedSqlQuery, tx?: Prisma.TransactionClient) {
    if (tx !== undefined) {
      return this.repository.executeGeneratedQuery(query.sql, query.parameters, bandId, tx);
    }

    return this.prisma.$transaction(async internalTx => {
      await this.repository.configureReadOnlyTransaction(internalTx);
      return this.repository.executeGeneratedQuery(query.sql, query.parameters, bandId, internalTx);
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

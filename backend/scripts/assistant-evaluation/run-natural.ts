import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

import { EVALUATOR_VERSION, evaluateRows } from './evaluate-rows';
import { readEvaluationDatabaseUrl, readEvaluationOutputPath } from './evaluation-environment';

import { PrismaService } from '../../src/database/prisma';
import { getAiConfig } from '../../src/modules/ai/ai.config';
import { LlmService } from '../../src/modules/ai/llm.service';
import { GeminiProvider } from '../../src/modules/ai/providers/gemini.provider';
import type { LlmProviderGroup } from '../../src/modules/ai/providers/llm-provider';
import { OpenAiCompatibleProvider } from '../../src/modules/ai/providers/openai-compatible.provider';
import { AssistantService } from '../../src/modules/assistant/assistant.service';
import { AnswerRenderer } from '../../src/modules/assistant/rendering/answer-renderer';
import { AssistantPrismaRepository } from '../../src/modules/assistant/repositories/assistant.prisma-repository';
import { InvalidSqlQueryError, SqlQueryValidator } from '../../src/modules/assistant/sql/sql-query.validator';
import type { ValidatedSqlQuery } from '../../src/modules/assistant/sql/generated-sql.type';

import { FIXED_NOW, NATURAL_QUERY_CASES, type NaturalQueryCase, TARGET_BAND_ID } from './corpus';
import { HOLDOUT_QUERY_CASES } from './holdout-corpus';

// dev는 수정에 사용한 50문항, holdout은 수정에 사용하지 않는 20문항이다.
const CORPORA = { dev: { cases: NATURAL_QUERY_CASES, size: 50 }, holdout: { cases: HOLDOUT_QUERY_CASES, size: 20 } };
const CORPUS_NAME = (process.env.EXPERIMENT_CORPUS ?? 'dev') as keyof typeof CORPORA;
const CASES = CORPORA[CORPUS_NAME]?.cases;

interface GenerationResult {
  status: 'QUERY' | 'UNSUPPORTED';
  query?: ValidatedSqlQuery;
  reason?: string;
  meta: { providerName: string | null; modelName: string | null };
}

interface EvaluationService {
  generateSqlFromQuestion(question: string, now: Date): Promise<GenerationResult>;
}

interface CaseResult {
  id: string;
  category: string;
  question: string;
  outcome: 'correct' | 'wrong_result' | 'unsupported' | 'generation_failed' | 'execution_failed';
  resultMatches: boolean;
  validationAttempts: number;
  validationFailures: string[];
  llmCalls: number;
  inputTokens: number;
  outputTokens: number;
  totalLatencyMs: number;
  providerName: string | null;
  modelName: string | null;
  generatedSql: string | null;
  generatedParameters: Array<string | number | boolean> | null;
  expectedRows: unknown[];
  actualRows: unknown[] | null;
  comparisonBandSentinelFound: boolean;
  error: string | null;
  comparisonReason: string | null;
  generationTrace: unknown[];
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  const databaseUrl = readEvaluationDatabaseUrl(process.env.ASSISTANT_EVALUATION_DATABASE_URL);
  const defaultEnvPath = existsSync('.env.development') ? '.env.development' : '.env';
  const envPath = process.env.ASSISTANT_EVALUATION_ENV_FILE ?? defaultEnvPath;
  if (existsSync(envPath)) loadEnvFile(envPath);
  process.env.DATABASE_URL = databaseUrl;
  const outputPath = readEvaluationOutputPath(
    process.env.EXPERIMENT_OUTPUT_PATH,
    execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim(),
  );
  if (!outputPath) throw new Error('EXPERIMENT_OUTPUT_PATH가 필요합니다.');
  if (existsSync(outputPath)) throw new Error('기존 원시 결과는 덮어쓰지 않습니다.');

  if (!CASES || CASES.length !== CORPORA[CORPUS_NAME].size) {
    throw new Error(`EXPERIMENT_CORPUS는 dev 또는 holdout이며 문항 수가 고정돼야 합니다: ${CORPUS_NAME}`);
  }

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    if (process.env.EXPERIMENT_PREFLIGHT_ONLY === 'true') {
      for (const queryCase of CASES) {
        await prisma.$queryRawUnsafe(queryCase.goldSql, TARGET_BAND_ID, ...queryCase.goldParameters);
      }

      process.stdout.write(`${JSON.stringify({ preflight: 'passed', corpus: CORPUS_NAME, cases: CASES.length })}\n`);
      return;
    }

    const validator = new SqlQueryValidator();
    const repository = new AssistantPrismaRepository(prisma);
    const aiConfig = getAiConfig({
      ...process.env,
      LLM_PROVIDERS: 'gemini',
      LLM_KEY_ROTATION_ENABLED: 'false',
      LLM_PROVIDER_ROTATION_ENABLED: 'false',
    });
    if (aiConfig.providerGroups.length !== 1) throw new Error('로컬 env의 Gemini 키가 필요합니다.');
    const providerGroups: LlmProviderGroup[] = aiConfig.providerGroups.map(group => ({
      name: group.name,
      credentials: group.credentials.map(credential =>
        credential.kind === 'gemini' ? new GeminiProvider(credential) : new OpenAiCompatibleProvider(credential),
      ),
    }));
    const llmService = new LlmService(providerGroups, aiConfig);
    const service = new AssistantService(
      llmService,
      undefined as never,
      repository,
      prisma,
      validator,
      new AnswerRenderer(),
    ) as unknown as EvaluationService;
    const experiment = {
      evaluatorVersion: EVALUATOR_VERSION,
      corpus: CORPUS_NAME,
      gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      sourceHashes: Object.fromEntries(
        [
          'scripts/assistant-evaluation/corpus.ts',
          'scripts/assistant-evaluation/holdout-corpus.ts',
          'scripts/assistant-evaluation/evaluate-rows.ts',
          'scripts/assistant-evaluation/run-natural.ts',
          'scripts/assistant-evaluation/seed-accuracy.sql',
          'prisma/schema.prisma',
          'src/modules/assistant/sql/sql-catalog.ts',
          'src/modules/assistant/sql/sql-query.validator.ts',
          'src/modules/assistant/sql/sql-generation.prompt.ts',
          'src/modules/assistant/assistant.service.ts',
          'src/modules/assistant/repositories/assistant.prisma-repository.ts',
          'src/modules/ai/providers/gemini.provider.ts',
          'src/modules/ai/ai.config.ts',
          'src/modules/ai/llm.service.ts',
          'scripts/assistant-evaluation/evaluation-environment.ts',
          'src/modules/assistant/sql/generated-sql.type.ts',
          'src/modules/assistant/sql/sql-generation.schema.ts',
          'src/modules/assistant/sql/sql-query-context.ts',
          'src/modules/assistant/rendering/sql-result.mapper.ts',
        ]
          .filter(existsSync)
          .map(path => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]),
      ),
      fixedNow: FIXED_NOW.toISOString(),
      startedAt,
      model: aiConfig.providerGroups[0].credentials[0].model,
      temperature: 0,
      keyRotationEnabled: false,
      providerRotationEnabled: false,
      concurrency: 1,
      delayMs: Number.parseInt(process.env.EXPERIMENT_DELAY_MS ?? '4500', 10),
      requestTimeoutMs: aiConfig.requestTimeoutMs,
      maxRetriesPerProvider: aiConfig.maxRetriesPerProvider,
      retryBaseDelayMs: aiConfig.retryBaseDelayMs,
      maxSqlRegenerations: 2,
      databaseKind: 'isolated-local-postgresql',
    };
    writeFileSync(outputPath, serialize({ experiment, complete: false, cases: [] }), { mode: 0o600 });
    const results = await runCases(service, validator, llmService, repository, prisma, results => {
      writeFileSync(outputPath, serialize({ experiment, complete: false, summary: summarize(results), cases: results }), { mode: 0o600 });
    });

    const payload = {
      experiment: { ...experiment, finishedAt: new Date().toISOString() },
      complete: true,
      summary: summarize(results),
      cases: results,
    };
    writeFileSync(outputPath, serialize(payload), { mode: 0o600 });
    process.stdout.write(`${JSON.stringify({ summary: payload.summary, outputPath }, null, 2)}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

async function runCases(
  service: EvaluationService,
  validator: SqlQueryValidator,
  llmService: LlmService,
  repository: AssistantPrismaRepository,
  prisma: PrismaService,
  checkpoint: (results: CaseResult[]) => void,
): Promise<CaseResult[]> {
  const delayMs = Number.parseInt(process.env.EXPERIMENT_DELAY_MS ?? '4500', 10);
  const results: CaseResult[] = [];
  const originalValidate = validator.validate.bind(validator);
  const originalGenerate = llmService.generateStructured.bind(llmService);
  let validationAttempts = 0;
  let validationFailures: string[] = [];
  let llmCalls = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let generationTrace: unknown[] = [];
  const expectedRowsById = new Map<string, unknown[]>();

  for (const queryCase of CASES) {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(queryCase.goldSql, TARGET_BAND_ID, ...queryCase.goldParameters);
    const selfGrade = await evaluateRows({ ...queryCase, tiePolicy: undefined }, rows, rows, queryCase.goldSql);
    if (!selfGrade.matches) throw new Error(`기대 쿼리의 출력 계약을 확인하지 못했습니다: ${queryCase.id}`);
    expectedRowsById.set(queryCase.id, rows);
  }

  validator.validate = async (raw: unknown, countUnit) => {
    validationAttempts += 1;

    try {
      return await originalValidate(raw, countUnit);
    } catch (error) {
      validationFailures.push(error instanceof InvalidSqlQueryError ? error.code : errorName(error));
      throw error;
    }
  };

  llmService.generateStructured = async request => {
    llmCalls += 1;
    const response = await originalGenerate(request);
    inputTokens += response.usage?.inputTokens ?? 0;
    outputTokens += response.usage?.outputTokens ?? 0;
    generationTrace.push({
      parsed: response.parsed,
      usage: response.usage,
      providerName: response.providerName,
      modelName: response.modelName,
      latencyMs: response.latencyMs,
    });
    return response;
  };

  for (const [index, queryCase] of CASES.entries()) {
    validationAttempts = 0;
    validationFailures = [];
    llmCalls = 0;
    inputTokens = 0;
    outputTokens = 0;
    generationTrace = [];
    const startedAt = Date.now();
    const expectedRows = expectedRowsById.get(queryCase.id) ?? [];
    let result: CaseResult;

    try {
      const generated = await service.generateSqlFromQuestion(queryCase.question, FIXED_NOW);

      if (generated.status === 'UNSUPPORTED' || generated.query === undefined) {
        result = failedResult(queryCase, 'unsupported', expectedRows, startedAt, {
          providerName: generated.meta.providerName,
          modelName: generated.meta.modelName,
          error: generated.reason ?? '지원하지 않는 질문으로 분류됨',
        });
      } else {
        result = await executeAndCompare(queryCase, { ...generated, query: generated.query }, expectedRows, startedAt, repository, prisma);
      }
    } catch (error) {
      result = failedResult(queryCase, 'generation_failed', expectedRows, startedAt, { error: errorMessage(error) });
    }

    results.push(result);
    checkpoint(results);
    if (result.outcome === 'generation_failed' && validationFailures.length === 0) {
      throw new Error('모델 호출 실패로 평가를 중단합니다. 부분 결과는 기록했습니다.');
    }
    process.stderr.write(`[${index + 1}/${CASES.length}] ${queryCase.id} ${result.outcome} ${result.totalLatencyMs}ms\n`);

    if (index < CASES.length - 1 && delayMs > 0) {
      await delay(delayMs);
    }
  }

  validator.validate = originalValidate;
  llmService.generateStructured = originalGenerate;

  return results;

  async function executeAndCompare(
    queryCase: NaturalQueryCase,
    generated: GenerationResult & { query: ValidatedSqlQuery },
    expectedRows: unknown[],
    startedAt: number,
    queryRepository: AssistantPrismaRepository,
    prismaService: PrismaService,
  ): Promise<CaseResult> {
    try {
      const actualRows = await prismaService.$transaction(async tx => {
        await queryRepository.configureReadOnlyTransaction(tx);
        return queryRepository.executeGeneratedQuery(generated.query.sql, generated.query.parameters, TARGET_BAND_ID, tx);
      });
      const comparison = await evaluateRows(queryCase, expectedRows as Record<string, unknown>[], actualRows, generated.query.sql);
      const matches = comparison.matches;

      return baseResult(queryCase, matches ? 'correct' : 'wrong_result', expectedRows, startedAt, {
        resultMatches: matches,
        comparisonReason: comparison.reason,
        providerName: generated.meta.providerName,
        modelName: generated.meta.modelName,
        generatedSql: generated.query.sql,
        generatedParameters: generated.query.parameters,
        actualRows,
        comparisonBandSentinelFound: containsComparisonSentinel(actualRows),
      });
    } catch (error) {
      return failedResult(queryCase, 'execution_failed', expectedRows, startedAt, {
        providerName: generated.meta.providerName,
        modelName: generated.meta.modelName,
        generatedSql: generated.query.sql,
        generatedParameters: generated.query.parameters,
        error: errorMessage(error),
      });
    }
  }

  function failedResult(
    queryCase: NaturalQueryCase,
    outcome: CaseResult['outcome'],
    expectedRows: unknown[],
    startedAt: number,
    details: Partial<CaseResult> & { error: string },
  ): CaseResult {
    return baseResult(queryCase, outcome, expectedRows, startedAt, { ...details, resultMatches: false });
  }

  function baseResult(
    queryCase: NaturalQueryCase,
    outcome: CaseResult['outcome'],
    expectedRows: unknown[],
    startedAt: number,
    details: Partial<CaseResult>,
  ): CaseResult {
    return {
      id: queryCase.id,
      category: queryCase.category,
      question: queryCase.question,
      outcome,
      resultMatches: details.resultMatches ?? false,
      validationAttempts,
      validationFailures: [...validationFailures],
      llmCalls,
      inputTokens,
      outputTokens,
      totalLatencyMs: Date.now() - startedAt,
      providerName: details.providerName ?? null,
      modelName: details.modelName ?? null,
      generatedSql: details.generatedSql ?? null,
      generatedParameters: details.generatedParameters ?? null,
      expectedRows,
      actualRows: details.actualRows ?? null,
      comparisonReason: details.comparisonReason ?? null,
      generationTrace: [...generationTrace],
      comparisonBandSentinelFound: details.comparisonBandSentinelFound ?? false,
      error: details.error ?? null,
    };
  }
}

function summarize(results: CaseResult[]) {
  const generated = results.filter(result => !['generation_failed', 'unsupported'].includes(result.outcome)).length;
  const correct = results.filter(result => result.resultMatches).length;
  const firstPass = results.filter(
    result => result.validationAttempts === 1 && !['generation_failed', 'unsupported'].includes(result.outcome),
  ).length;
  const initiallyFailed = results.filter(result => result.validationFailures.length > 0).length;
  const recovered = results.filter(result => result.validationFailures.length > 0 && result.resultMatches).length;
  const latencies = results.map(result => result.totalLatencyMs).sort((left, right) => left - right);

  return {
    total: results.length,
    generatedWithinLimit: generated,
    generationPassRatePercent: percent(generated, results.length),
    correct,
    executionAccuracyPercent: percent(correct, results.length),
    firstPass,
    firstPassRatePercent: percent(firstPass, results.length),
    initiallyFailedValidation: initiallyFailed,
    recoveredAfterRegeneration: recovered,
    regenerationRecoveryRatePercent: initiallyFailed === 0 ? null : percent(recovered, initiallyFailed),
    comparisonBandLeakCases: results.filter(result => result.comparisonBandSentinelFound).length,
    averageInputTokens: average(results.map(result => result.inputTokens)),
    averageOutputTokens: average(results.map(result => result.outputTokens)),
    totalInputTokens: results.reduce((sum, result) => sum + result.inputTokens, 0),
    totalOutputTokens: results.reduce((sum, result) => sum + result.outputTokens, 0),
    latencyP50Ms: percentile(latencies, 0.5),
    latencyP95Ms: percentile(latencies, 0.95),
    outcomes: Object.fromEntries(
      [...new Set(results.map(result => result.outcome))].map(outcome => [outcome, results.filter(result => result.outcome === outcome).length]),
    ),
  };
}

function serialize(value: unknown): string {
  return `${JSON.stringify(value, (_key, item: unknown) => (typeof item === 'bigint' ? item.toString() : item), 2)}\n`;
}

function containsComparisonSentinel(rows: unknown[]): boolean {
  const serialized = serialize(rows);
  return serialized.includes('비교멤버') || serialized.includes('비교 밴드') || serialized.includes('비교곡');
}

function percent(value: number, total: number): number {
  return Number(((value / total) * 100).toFixed(1));
}

function average(values: number[]): number {
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function percentile(sorted: number[], quantile: number): number {
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1)];
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

const keepAlive = setInterval(() => undefined, 1_000);

void main()
  .catch(error => {
    process.stderr.write(`${errorMessage(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => clearInterval(keepAlive));

import { z } from 'zod';

export const assistantPresetSchema = z.object({
  id: z.string(),
  // 홈 칩에 쓰는 짧은 이름. 이전 서버는 보내지 않으므로 질문 문장으로 대신한다.
  label: z.string().optional(),
  question: z.string(),
  // 이 추천 질문의 답 뒤에 보여줄 이어서 물어보기. 자유 질문으로 보낸다.
  followUps: z.array(z.string()).optional(),
});

const scheduleRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  scheduleType: z.enum(['PRACTICE', 'MEETING']),
  status: z.enum(['PLANNED', 'DONE', 'CANCELED']),
  startAt: z.string().nullable(),
  endAt: z.string().nullable(),
  placeName: z.string().nullable(),
  spaceName: z.string(),
});

const attendanceRowSchema = z.object({
  bandMemberId: z.string(),
  nickname: z.string(),
  attendanceStatus: z.enum(['PENDING', 'ATTENDING', 'ABSENT']).nullable(),
  scheduleId: z.string(),
  scheduleTitle: z.string(),
  scheduleStartAt: z.string().nullable(),
});

const songPracticeRowSchema = z.object({
  songId: z.string(),
  title: z.string(),
  artistName: z.string(),
  practiceCount: z.number(),
});

const memberParticipationRowSchema = z.object({
  bandMemberId: z.string(),
  nickname: z.string(),
  participationCount: z.number(),
});

// entity가 rows의 형태를 결정하므로 판별 유니온으로 파싱한다.
const assistantQueryResultSchema = z.discriminatedUnion('entity', [
  z
    .object({
      entity: z.literal('table'),
      title: z.string().optional(),
      columns: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
          format: z.enum(['plain', 'datetime']),
        }),
      ),
      rows: z.array(
        z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean(), z.null()]),
        ),
      ),
      hasMore: z.boolean(),
      // 서버 상한(MAX_ASSISTANT_RESULT_ROWS)이 바뀌어도 응답이 깨지지 않게 값을 고정하지 않고 행 수만 맞춰 본다.
      maxRows: z.number().int().positive(),
      resultMode: z.enum(['LIST', 'TOP_N', 'AGGREGATE', 'LEGACY']),
      conditions: z.array(z.string()),
    })
    .refine((result) => result.rows.length <= result.maxRows)
    .refine(
      (result) => {
        const keys = result.columns.map((column) => column.key);
        return (
          new Set(keys).size === keys.length &&
          result.rows.every(
            (row) =>
              Object.keys(row).length === keys.length &&
              keys.every((key) => Object.hasOwn(row, key)),
          )
        );
      },
      { message: '결과 컬럼과 행이 일치하지 않습니다.' },
    ),
  z.object({ entity: z.literal('schedule'), rows: z.array(scheduleRowSchema) }),
  z.object({
    entity: z.literal('attendance'),
    rows: z.array(attendanceRowSchema),
    scheduleTitle: z.string().nullable(),
    scheduleStartAt: z.string().nullable(),
  }),
  z.object({
    entity: z.literal('songPractice'),
    rows: z.array(songPracticeRowSchema),
  }),
  z.object({
    entity: z.literal('memberParticipation'),
    rows: z.array(memberParticipationRowSchema),
  }),
]);

export const assistantAnswerKindSchema = z.enum([
  'ANSWER',
  'UNSUPPORTED',
  'CLARIFICATION',
  'REPHRASE',
]);

/** 다음 질문에 직전 턴으로 돌려보낼 조회 구조. 화면에는 보이지 않고 대화 이력으로만 들고 있는다. */
const assistantQueryContextSchema = z.object({
  intent: z.string(),
  sql: z.string(),
  params: z.array(
    z.object({ position: z.number(), type: z.string(), value: z.string() }),
  ),
  resultMode: z.enum(['LIST', 'TOP_N', 'AGGREGATE']).nullable(),
  rowCount: z.number(),
  hasMore: z.boolean(),
});

const assistantClarificationSchema = z.object({
  candidates: z.array(z.object({ name: z.string(), question: z.string() })),
  hasMore: z.boolean(),
});

export const assistantAnswerSchema = z
  .object({
    answerable: z.boolean(),
    kind: assistantAnswerKindSchema.optional(),
    summary: z.string(),
    result: assistantQueryResultSchema.nullable(),
    clarification: assistantClarificationSchema.nullable().optional(),
    // 이전 서버는 보내지 않는다. 없으면 다음 질문에 직전 턴을 붙이지 않는다.
    context: assistantQueryContextSchema.nullable().optional(),
    meta: z.object({
      providerName: z.string().nullable(),
      modelName: z.string().nullable(),
      usedLlm: z.boolean(),
      inputTokens: z.number(),
      outputTokens: z.number(),
      latencyMs: z.number(),
    }),
  })
  // 배포 순서가 어긋나 kind가 없는 응답이 와도 화면이 같은 분기를 타게 한다.
  .transform((answer) => ({
    ...answer,
    kind: answer.kind ?? (answer.answerable ? 'ANSWER' : 'UNSUPPORTED'),
    clarification: answer.clarification ?? null,
    context: answer.context ?? null,
  }));

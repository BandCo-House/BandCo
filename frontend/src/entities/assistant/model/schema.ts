import { z } from 'zod';

export const assistantPresetSchema = z.object({
  id: z.string(),
  // 홈 칩에 쓰는 짧은 이름. 이전 서버는 보내지 않으므로 질문 문장으로 대신한다.
  label: z.string().optional(),
  question: z.string(),
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
      rows: z
        .array(
          z.record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean(), z.null()]),
          ),
        )
        .max(50),
      hasMore: z.boolean(),
      maxRows: z.literal(50),
      resultMode: z.enum(['LIST', 'TOP_N', 'AGGREGATE', 'LEGACY']),
      conditions: z.array(z.string()),
    })
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
  }));

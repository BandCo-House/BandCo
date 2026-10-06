import { z } from 'zod';

export const assistantPresetSchema = z.object({
  id: z.string(),
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

export const assistantAnswerSchema = z.object({
  answerable: z.boolean(),
  summary: z.string(),
  result: assistantQueryResultSchema.nullable(),
  meta: z.object({
    providerName: z.string().nullable(),
    modelName: z.string().nullable(),
    usedLlm: z.boolean(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    latencyMs: z.number(),
  }),
});

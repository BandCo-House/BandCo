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

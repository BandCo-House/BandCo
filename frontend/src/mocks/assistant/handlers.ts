import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type {
  AssistantAnswer,
  AssistantPreset,
} from '@/entities/assistant/model/types';
import { API_URL } from '../config';

const presets: AssistantPreset[] = [
  { id: 'next-schedule', question: '다음 합주 일정이 언제야?' },
  {
    id: 'pending-attendance',
    question: '아직 참석 여부를 응답하지 않은 사람은?',
  },
  {
    id: 'most-practiced-song-this-month',
    question: '이번 달 가장 많이 연습한 곡은?',
  },
  {
    id: 'most-active-member-3months',
    question: '최근 3개월 동안 합주에 가장 많이 참여한 멤버는?',
  },
];

const createMeta = (): AssistantAnswer['meta'] => ({
  providerName: 'gemini',
  modelName: 'gemini-3.1-flash-lite',
  usedLlm: true,
  inputTokens: 420,
  outputTokens: 38,
  latencyMs: 640,
});

const answers: Record<string, AssistantAnswer> = {
  'next-schedule': {
    answerable: true,
    summary:
      '9월 3일 (수) 19:00 정기 합주 일정이 있습니다. 장소는 홍대 사운드스튜디오입니다.',
    result: {
      entity: 'schedule',
      rows: [
        {
          id: 'schedule-1',
          title: '정기 합주',
          scheduleType: 'PRACTICE',
          status: 'PLANNED',
          startAt: '2026-09-03T19:00:00+09:00',
          endAt: '2026-09-03T22:00:00+09:00',
          placeName: '홍대 사운드스튜디오',
          spaceName: '가을 정기공연',
        },
      ],
    },
    meta: createMeta(),
  },
  'pending-attendance': {
    answerable: true,
    summary: '9월 3일 (수) 19:00 정기 합주 기준 3명입니다: 준혁, 서연, 도윤',
    result: {
      entity: 'attendance',
      scheduleTitle: '정기 합주',
      scheduleStartAt: '2026-09-03T19:00:00+09:00',
      rows: [
        {
          bandMemberId: 'member-1',
          nickname: '준혁',
          attendanceStatus: 'PENDING',
          scheduleId: 'schedule-1',
          scheduleTitle: '정기 합주',
          scheduleStartAt: '2026-09-03T19:00:00+09:00',
        },
        {
          bandMemberId: 'member-2',
          nickname: '서연',
          attendanceStatus: null,
          scheduleId: 'schedule-1',
          scheduleTitle: '정기 합주',
          scheduleStartAt: '2026-09-03T19:00:00+09:00',
        },
        {
          bandMemberId: 'member-3',
          nickname: '도윤',
          attendanceStatus: 'PENDING',
          scheduleId: 'schedule-1',
          scheduleTitle: '정기 합주',
          scheduleStartAt: '2026-09-03T19:00:00+09:00',
        },
      ],
    },
    meta: createMeta(),
  },
  'most-practiced-song-this-month': {
    answerable: true,
    summary:
      '가장 많이 연습한 곡은 Bohemian Rhapsody(Queen), 5회입니다. 다음은 청춘 3회, 밤편지 2회입니다.',
    result: {
      entity: 'songPractice',
      rows: [
        {
          songId: 'song-1',
          title: 'Bohemian Rhapsody',
          artistName: 'Queen',
          practiceCount: 5,
        },
        {
          songId: 'song-2',
          title: '청춘',
          artistName: '산울림',
          practiceCount: 3,
        },
        {
          songId: 'song-3',
          title: '밤편지',
          artistName: '아이유',
          practiceCount: 2,
        },
      ],
    },
    meta: createMeta(),
  },
  'most-active-member-3months': {
    answerable: true,
    summary:
      '가장 많이 참여한 멤버는 준혁, 12회입니다. 다음은 서연 10회, 도윤 8회입니다.',
    result: {
      entity: 'memberParticipation',
      rows: [
        { bandMemberId: 'member-1', nickname: '준혁', participationCount: 12 },
        { bandMemberId: 'member-2', nickname: '서연', participationCount: 10 },
        { bandMemberId: 'member-3', nickname: '도윤', participationCount: 8 },
      ],
    },
    meta: createMeta(),
  },
};

const UNANSWERABLE: AssistantAnswer = {
  answerable: false,
  summary:
    '이 질문은 아직 답할 수 없습니다. 일정, 참석 현황, 곡별 합주 횟수, 멤버별 참석 횟수를 물어봐 주세요.',
  result: null,
  meta: createMeta(),
};

// MSW는 UI 상태 확인용이므로 실제 Text-to-SQL 대신 대표 질문의 고정 응답만 제공한다.
const QUESTION_KEYWORDS: [RegExp, string][] = [
  [/일정|언제|합주.*언제/, 'next-schedule'],
  [/참석|응답|미응답/, 'pending-attendance'],
  [/곡|노래|연습/, 'most-practiced-song-this-month'],
  [/멤버|사람|참여/, 'most-active-member-3months'],
];

const findAnswerByQuestion = (question: string): AssistantAnswer => {
  const matched = QUESTION_KEYWORDS.find(([pattern]) => pattern.test(question));
  if (matched === undefined) return UNANSWERABLE;

  return answers[matched[1]];
};

interface AskAssistantBody {
  question?: string;
  presetId?: string;
}

export const assistantHandlers = [
  http.get(`${API_URL}/assistant/presets`, () =>
    HttpResponse.json<ApiResponse<{ presets: AssistantPreset[] }>>({
      status: 'success',
      error: null,
      message: '추천 질문 목록 조회 성공',
      data: { presets },
    }),
  ),

  http.post(`${API_URL}/bands/:bandId/assistant/query`, async ({ request }) => {
    const body = (await request.json()) as AskAssistantBody;

    if (body.presetId !== undefined) {
      const answer = answers[body.presetId];
      if (answer === undefined) {
        return HttpResponse.json(
          {
            status: 'fail',
            error: { code: 'NOT_FOUND', details: { statusCode: 404 } },
            message: '요청한 추천 질문을 찾을 수 없습니다.',
            data: {},
          },
          { status: 404 },
        );
      }
      return HttpResponse.json<ApiResponse<AssistantAnswer>>({
        status: 'success',
        error: null,
        message: '밴드 데이터 질문 처리 성공',
        data: answer,
      });
    }

    return HttpResponse.json<ApiResponse<AssistantAnswer>>({
      status: 'success',
      error: null,
      message: '밴드 데이터 질문 처리 성공',
      data: findAnswerByQuestion(body.question ?? ''),
    });
  }),
];

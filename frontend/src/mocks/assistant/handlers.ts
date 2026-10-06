import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type {
  AssistantAnswer,
  AssistantPreset,
} from '@/entities/assistant/model/types';
import { API_URL } from '../config';

const presets: AssistantPreset[] = [
  {
    id: 'next-schedule',
    label: '다음 합주',
    question: '다음 합주 일정이 언제야?',
  },
  {
    id: 'pending-attendance',
    label: '미응답자',
    question: '아직 참석 여부를 응답하지 않은 사람은?',
  },
  {
    id: 'most-practiced-song-this-month',
    label: '이번 달 연습곡',
    question: '이번 달 가장 많이 연습한 곡은?',
  },
  {
    id: 'most-active-member-3months',
    label: '참여 많은 멤버',
    question: '최근 3개월 동안 합주에 가장 많이 참여한 멤버는?',
  },
];

const presetMeta: AssistantAnswer['meta'] = {
  providerName: null,
  modelName: null,
  usedLlm: false,
  inputTokens: 0,
  outputTokens: 0,
  latencyMs: 40,
};

const llmMeta: AssistantAnswer['meta'] = {
  providerName: 'gemini',
  modelName: 'gemini-3.1-flash-lite',
  usedLlm: true,
  inputTokens: 4200,
  outputTokens: 260,
  latencyMs: 1800,
};

type TableResult = Extract<
  NonNullable<AssistantAnswer['result']>,
  { entity: 'table' }
>;

const table = (
  title: string,
  resultMode: TableResult['resultMode'],
  columns: TableResult['columns'],
  rows: TableResult['rows'],
  conditions: string[],
): TableResult => ({
  entity: 'table',
  title,
  columns,
  rows,
  hasMore: false,
  maxRows: 50,
  resultMode,
  conditions,
});

const answer = (
  summary: string,
  result: TableResult,
  meta = llmMeta,
): AssistantAnswer => ({
  answerable: true,
  kind: 'ANSWER',
  summary,
  result,
  clarification: null,
  meta,
});

const NEXT_PRACTICE = ['일정 종류: 합주', '일정 상태: 예정', '시작: 지금 이후'];

// MSW는 UI 상태 확인용이므로 실제 Text-to-SQL 대신 대표 질문의 고정 응답만 제공한다.
const presetAnswers: Record<string, AssistantAnswer> = {
  'next-schedule': answer(
    '다음 합주: 정기 합주 · 2026. 10. 8. 19:00 · 홍대 사운드스튜디오',
    table(
      '다음 합주',
      'TOP_N',
      [
        { key: 'title', label: '일정', format: 'plain' },
        { key: 'start_at', label: '시작', format: 'datetime' },
        { key: 'place_name', label: '장소', format: 'plain' },
      ],
      [
        {
          title: '정기 합주',
          start_at: '2026-10-08T10:00:00.000Z',
          place_name: '홍대 사운드스튜디오',
        },
      ],
      NEXT_PRACTICE,
    ),
    presetMeta,
  ),
  'pending-attendance': answer(
    '다음 합주 미응답자 3명',
    table(
      '다음 합주 미응답자',
      'LIST',
      [{ key: 'nickname', label: '닉네임', format: 'plain' }],
      [{ nickname: '도윤' }, { nickname: '서연' }, { nickname: '준혁' }],
      [...NEXT_PRACTICE, '응답: 없음 또는 미응답'],
    ),
    presetMeta,
  ),
  'most-practiced-song-this-month': answer(
    '이번 달 많이 연습한 곡: Bohemian Rhapsody 외 2건',
    table(
      '이번 달 많이 연습한 곡',
      'TOP_N',
      [
        { key: 'title', label: '곡 제목', format: 'plain' },
        { key: 'artist_name', label: '아티스트', format: 'plain' },
        { key: 'practice_count', label: '연습 횟수', format: 'plain' },
      ],
      [
        { title: 'Bohemian Rhapsody', artist_name: 'Queen', practice_count: 5 },
        { title: '청춘', artist_name: '산울림', practice_count: 3 },
        { title: '밤편지', artist_name: '아이유', practice_count: 2 },
      ],
      ['일정 종류: 합주', '일정 상태: 취소 제외', '시작: 10월 1일 ~ 10월 31일'],
    ),
    presetMeta,
  ),
  'most-active-member-3months': answer(
    '최근 3개월 합주 참여가 많은 멤버: 준혁 외 2건',
    table(
      '최근 3개월 합주 참여가 많은 멤버',
      'TOP_N',
      [
        { key: 'nickname', label: '닉네임', format: 'plain' },
        { key: 'attendance_count', label: '참석 횟수', format: 'plain' },
      ],
      [
        { nickname: '준혁', attendance_count: 12 },
        { nickname: '서연', attendance_count: 10 },
        { nickname: '도윤', attendance_count: 8 },
      ],
      ['일정 종류: 합주', '일정 상태: 완료', '응답: 참석'],
    ),
    presetMeta,
  ),
};

const COUNT_ANSWER = answer(
  '다음 합주 참석 인원: 13',
  table(
    '다음 합주 참석 인원',
    'AGGREGATE',
    [{ key: 'attendee_count', label: '참석 인원', format: 'plain' }],
    [{ attendee_count: 13 }],
    [...NEXT_PRACTICE, '응답: 참석'],
  ),
);

const UNSUPPORTED: AssistantAnswer = {
  answerable: false,
  kind: 'UNSUPPORTED',
  summary: '밴드 데이터에 날씨 정보가 없습니다.',
  result: null,
  clarification: null,
  meta: llmMeta,
};

const CLARIFICATION: AssistantAnswer = {
  answerable: false,
  kind: 'CLARIFICATION',
  summary: '어떤 아티스트인가요? 밴드 곡 목록에 비슷한 이름이 2개 있어요.',
  result: null,
  clarification: {
    candidates: [
      { name: '아이유', question: "'아이유' 곡 알려줘" },
      { name: '아이유 (IU)', question: "'아이유 (IU)' 곡 알려줘" },
    ],
    hasMore: false,
  },
  meta: llmMeta,
};

const QUESTION_ANSWERS: [RegExp, AssistantAnswer][] = [
  [/몇 ?명/, COUNT_ANSWER],
  [/아티스트|가수/, CLARIFICATION],
  [/일정|언제/, presetAnswers['next-schedule']],
  [/참석|응답/, presetAnswers['pending-attendance']],
  [/곡|노래|연습/, presetAnswers['most-practiced-song-this-month']],
  [/멤버|사람|참여/, presetAnswers['most-active-member-3months']],
];

const findAnswerByQuestion = (question: string): AssistantAnswer =>
  QUESTION_ANSWERS.find(([pattern]) => pattern.test(question))?.[1] ??
  UNSUPPORTED;

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
      const presetAnswer = presetAnswers[body.presetId];
      if (presetAnswer === undefined) {
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
        data: presetAnswer,
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

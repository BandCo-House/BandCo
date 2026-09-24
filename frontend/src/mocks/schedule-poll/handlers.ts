import { http, HttpResponse } from 'msw';
import type {
  CreateSchedulePollRequest,
  GetSchedulePollsResult,
  SchedulePoll,
  SchedulePollListItem,
  SchedulePollVoter,
  UpdateMySchedulePollVoteRequest,
} from '@/entities/schedule-poll/model/types';
import { SCHEDULE_POLL_OPTION_MAX_COUNT } from '@/entities/schedule-poll/model/types';
import type { ApiSuccessResponse } from '@/shared/api';
import { BAND_MEMBERS } from '../member/handlers';
import { API_URL } from '../config';

/** mock 로그인 사용자에 해당하는 밴드 멤버(투표의 '나'). */
const ME_MEMBER_ID = 'member-1';

const toVoter = (bandMemberId: string): SchedulePollVoter => {
  const member = BAND_MEMBERS.find((m) => m.bandMemberId === bandMemberId);
  return {
    bandMemberId,
    userId: member?.userId ?? bandMemberId,
    nickname: member?.nickname ?? bandMemberId,
    avatarUrl: member?.avatarUrl ?? null,
  };
};

interface MockPollOption {
  schedulePollOptionId: string;
  startAt: string;
  endAt: string;
  /** 이 후보를 고른 밴드 멤버 ID 목록. */
  voterMemberIds: string[];
}

interface MockPoll {
  schedulePollId: string;
  bandSpaceId: string;
  createdByBandMemberId: string | null;
  name: string;
  closesAt: string;
  options: MockPollOption[];
  createdAt: string;
  updatedAt: string;
}

/** 오늘부터 offsetDay 뒤의 로컬 시각 ISO 문자열. */
const atOffsetDay = (offsetDay: number, hour: number, minute = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDay);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

let optionSeq = 0;
const makeOption = (
  offsetDay: number,
  hour: number,
  minute: number,
  voterMemberIds: string[],
): MockPollOption => {
  optionSeq += 1;
  const endMinute = minute + 30;
  return {
    schedulePollOptionId: `poll-option-${optionSeq}`,
    startAt: atOffsetDay(offsetDay, hour, minute),
    endAt: atOffsetDay(
      offsetDay,
      hour + Math.floor(endMinute / 60),
      endMinute % 60,
    ),
    voterMemberIds,
  };
};

/** 시안과 비슷한 분포: 연속 3일 + 다음 주 2일, 30분 단위 후보. */
const seedPolls = (): MockPoll[] => {
  const all = BAND_MEMBERS.map((m) => m.bandMemberId);
  const many = all.slice(0, 6);
  const some = all.slice(1, 5);
  const few = all.slice(2, 4);

  const pollA: MockPoll = {
    schedulePollId: 'poll-1',
    bandSpaceId: 'space-1',
    createdByBandMemberId: 'member-2',
    name: '좋은 날 오프닝 연습',
    closesAt: atOffsetDay(5, 17),
    options: [
      // 첫 3일: 참여가 몰린 구간
      ...[7, 8, 9].flatMap((day, index) => [
        makeOption(day, 15, 30, index === 1 ? many : some),
        makeOption(day, 16, 0, many),
        makeOption(day, 16, 30, index === 2 ? few : many),
        makeOption(day, 17, 0, index === 0 ? many : few),
      ]),
      // 다음 주 2일: 아직 표가 적은 구간
      ...[14, 15].flatMap((day) => [
        makeOption(day, 15, 30, few),
        makeOption(day, 16, 0, some),
        makeOption(day, 16, 30, []),
        makeOption(day, 17, 0, []),
      ]),
    ],
    createdAt: atOffsetDay(-2, 10),
    updatedAt: atOffsetDay(-1, 10),
  };

  const pollB: MockPoll = {
    schedulePollId: 'poll-2',
    bandSpaceId: 'space-1',
    createdByBandMemberId: 'member-3',
    name: '공연 전 리허설',
    closesAt: atOffsetDay(3, 19),
    options: [11, 12].flatMap((day) => [
      makeOption(day, 19, 0, few),
      makeOption(day, 19, 30, few),
      makeOption(day, 20, 0, []),
      makeOption(day, 20, 30, []),
    ]),
    createdAt: atOffsetDay(-1, 9),
    updatedAt: atOffsetDay(-1, 9),
  };

  return [pollA, pollB];
};

const polls = seedPolls();
let pollSeq = polls.length;

const distinctVoterCount = (poll: MockPoll): number =>
  new Set(poll.options.flatMap((option) => option.voterMemberIds)).size;

/** 저장된 mock 투표를 백엔드 상세 result 형태로 변환한다. */
const toPollResult = (poll: MockPoll): SchedulePoll => {
  const maxVotes = Math.max(
    0,
    ...poll.options.map((option) => option.voterMemberIds.length),
  );
  return {
    schedulePollId: poll.schedulePollId,
    bandSpaceId: poll.bandSpaceId,
    createdByBandMemberId: poll.createdByBandMemberId,
    name: poll.name,
    closesAt: poll.closesAt,
    voterCount: distinctVoterCount(poll),
    options: poll.options.map((option) => ({
      schedulePollOptionId: option.schedulePollOptionId,
      startAt: option.startAt,
      endAt: option.endAt,
      voters: option.voterMemberIds.map(toVoter),
      voteCount: option.voterMemberIds.length,
      isRecommended: maxVotes > 0 && option.voterMemberIds.length === maxVotes,
    })),
    myOptionIds: poll.options
      .filter((option) => option.voterMemberIds.includes(ME_MEMBER_ID))
      .map((option) => option.schedulePollOptionId),
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
  };
};

const toListItem = (poll: MockPoll): SchedulePollListItem => ({
  schedulePollId: poll.schedulePollId,
  bandSpaceId: poll.bandSpaceId,
  createdByBandMemberId: poll.createdByBandMemberId,
  name: poll.name,
  closesAt: poll.closesAt,
  optionCount: poll.options.length,
  voterCount: distinctVoterCount(poll),
  hasVoted: poll.options.some((option) =>
    option.voterMemberIds.includes(ME_MEMBER_ID),
  ),
  createdAt: poll.createdAt,
  updatedAt: poll.updatedAt,
});

const success = <T>(message: string, data: T): ApiSuccessResponse<T> => ({
  status: 'success',
  error: null,
  message,
  data,
});

// HttpResponse.json에 실패 봉투 제네릭을 달면 성공 응답과의 유니언 추론이 깨져 타입만 넓게 둔다.
const fail = (statusCode: number, code: string, message: string) =>
  HttpResponse.json(
    {
      status: 'fail',
      error: { code, details: { statusCode } },
      message,
      data: {},
    },
    { status: statusCode },
  );

export const schedulePollHandlers = [
  http.get(`${API_URL}/bandspaces/:spaceId/schedule-polls`, ({ params }) => {
    const items = polls
      .filter((poll) => poll.bandSpaceId === params.spaceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toListItem);
    return HttpResponse.json<ApiSuccessResponse<GetSchedulePollsResult>>(
      success('일정 조율 투표 목록 조회 성공', { items }),
    );
  }),

  http.post(
    `${API_URL}/bandspaces/:spaceId/schedule-polls`,
    async ({ params, request }) => {
      const body = (await request.json()) as CreateSchedulePollRequest;
      if (
        !body.options?.length ||
        body.options.length > SCHEDULE_POLL_OPTION_MAX_COUNT
      ) {
        return fail(
          400,
          'BAD_REQUEST',
          `후보 시간은 1~${SCHEDULE_POLL_OPTION_MAX_COUNT}개여야 합니다.`,
        );
      }
      if (!body.name?.trim()) {
        return fail(400, 'BAD_REQUEST', '투표 이름을 입력해야 합니다.');
      }
      if (!body.closesAt || new Date(body.closesAt) <= new Date()) {
        return fail(
          400,
          'BAD_REQUEST',
          '투표 마감 기한은 현재 시각 이후여야 합니다.',
        );
      }

      pollSeq += 1;
      const now = new Date().toISOString();
      const poll: MockPoll = {
        schedulePollId: `poll-${pollSeq}`,
        bandSpaceId: String(params.spaceId),
        createdByBandMemberId: ME_MEMBER_ID,
        name: body.name,
        closesAt: new Date(body.closesAt).toISOString(),
        options: body.options.map((option) => {
          optionSeq += 1;
          return {
            schedulePollOptionId: `poll-option-${optionSeq}`,
            startAt: option.startAt,
            endAt: option.endAt,
            voterMemberIds: [],
          };
        }),
        createdAt: now,
        updatedAt: now,
      };
      polls.push(poll);

      return HttpResponse.json<ApiSuccessResponse<SchedulePoll>>(
        success('일정 조율 투표 생성 성공', toPollResult(poll)),
        { status: 201 },
      );
    },
  ),

  http.get(`${API_URL}/schedule-polls/:pollId`, ({ params }) => {
    const poll = polls.find((p) => p.schedulePollId === params.pollId);
    if (!poll) {
      return fail(404, 'NOT_FOUND', '일정 조율 투표를 찾을 수 없습니다.');
    }
    return HttpResponse.json<ApiSuccessResponse<SchedulePoll>>(
      success('일정 조율 투표 조회 성공', toPollResult(poll)),
    );
  }),

  http.put(
    `${API_URL}/schedule-polls/:pollId/votes/me`,
    async ({ params, request }) => {
      const poll = polls.find((p) => p.schedulePollId === params.pollId);
      if (!poll) {
        return fail(404, 'NOT_FOUND', '일정 조율 투표를 찾을 수 없습니다.');
      }

      if (new Date(poll.closesAt) <= new Date()) {
        return fail(
          400,
          'BAD_REQUEST',
          '마감된 일정 투표에는 투표할 수 없습니다.',
        );
      }

      const body = (await request.json()) as UpdateMySchedulePollVoteRequest;
      const optionIds = new Set(
        poll.options.map((o) => o.schedulePollOptionId),
      );
      if (body.schedulePollOptionIds.some((id) => !optionIds.has(id))) {
        return fail(
          400,
          'BAD_REQUEST',
          '다른 투표의 후보를 선택할 수 없습니다.',
        );
      }

      const selected = new Set(body.schedulePollOptionIds);
      for (const option of poll.options) {
        const withoutMe = option.voterMemberIds.filter(
          (id) => id !== ME_MEMBER_ID,
        );
        option.voterMemberIds = selected.has(option.schedulePollOptionId)
          ? [...withoutMe, ME_MEMBER_ID]
          : withoutMe;
      }
      poll.updatedAt = new Date().toISOString();

      return HttpResponse.json<ApiSuccessResponse<SchedulePoll>>(
        success('일정 조율 투표 반영 성공', toPollResult(poll)),
      );
    },
  ),

  http.delete(`${API_URL}/schedule-polls/:pollId`, ({ params }) => {
    const index = polls.findIndex((p) => p.schedulePollId === params.pollId);
    if (index === -1) {
      return fail(404, 'NOT_FOUND', '일정 조율 투표를 찾을 수 없습니다.');
    }
    const [removed] = polls.splice(index, 1);
    return HttpResponse.json<ApiSuccessResponse<{ schedulePollId: string }>>(
      success('일정 조율 투표 삭제 성공', {
        schedulePollId: removed.schedulePollId,
      }),
    );
  }),
];

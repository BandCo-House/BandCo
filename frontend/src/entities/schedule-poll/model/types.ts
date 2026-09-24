// backend/src/modules/schedule-polls/types/schedule-poll.type.ts 의 result 타입을 따른다.

export interface SchedulePollVoter {
  bandMemberId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface SchedulePollOption {
  schedulePollOptionId: string;
  /** 후보 시작 일시 (ISO 8601) */
  startAt: string;
  /** 후보 종료 일시 (ISO 8601) */
  endAt: string;
  voters: SchedulePollVoter[];
  voteCount: number;
  isRecommended: boolean;
}

export interface SchedulePoll {
  schedulePollId: string;
  bandSpaceId: string;
  /** 생성자가 밴드를 떠나면 null. */
  createdByBandMemberId: string | null;
  name: string;
  /** 투표 마감 일시 (ISO 8601). 마감 후에는 투표 등록·수정이 거부된다. */
  closesAt: string;
  /** 한 명이 여러 후보를 골라도 한 명으로 센 참여 인원. */
  voterCount: number;
  options: SchedulePollOption[];
  /** 내가 선택한 후보 ID 목록. */
  myOptionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SchedulePollListItem {
  schedulePollId: string;
  bandSpaceId: string;
  createdByBandMemberId: string | null;
  name: string;
  closesAt: string;
  optionCount: number;
  voterCount: number;
  hasVoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetSchedulePollsResult {
  items: SchedulePollListItem[];
}

export interface CreateSchedulePollOptionInput {
  startAt: string;
  endAt: string;
}

export interface CreateSchedulePollRequest {
  name: string;
  /** ISO 8601. 현재 시각 이후여야 한다. */
  closesAt: string;
  options: CreateSchedulePollOptionInput[];
}

export interface UpdateMySchedulePollVoteRequest {
  schedulePollOptionIds: string[];
}

/** 백엔드 후보 시간 상한(backend SCHEDULE_POLL_OPTION_MAX_COUNT과 동일). */
export const SCHEDULE_POLL_OPTION_MAX_COUNT = 20;

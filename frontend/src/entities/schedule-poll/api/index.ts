import { apiDelete, apiGet, apiPost, apiPut } from '@/shared/api/client';
import type {
  CreateSchedulePollRequest,
  GetSchedulePollsResult,
  SchedulePoll,
  UpdateMySchedulePollVoteRequest,
} from '../model/types';

/** 일정 조율 투표 목록 조회(GET /bandspaces/:spaceId/schedule-polls). */
export const getSchedulePolls = (spaceId: string) =>
  apiGet<GetSchedulePollsResult>(`/bandspaces/${spaceId}/schedule-polls`);

/** 일정 조율 투표 상세 조회(GET /schedule-polls/:pollId). */
export const getSchedulePoll = (pollId: string) =>
  apiGet<SchedulePoll>(`/schedule-polls/${pollId}`);

/** 일정 조율 투표 생성(POST /bandspaces/:spaceId/schedule-polls). */
export const createSchedulePoll = (
  spaceId: string,
  body: CreateSchedulePollRequest,
) => apiPost<SchedulePoll>(`/bandspaces/${spaceId}/schedule-polls`, body);

/** 내 투표 전량 교체(PUT /schedule-polls/:pollId/votes/me). 빈 배열이면 철회. */
export const updateMySchedulePollVote = (
  pollId: string,
  body: UpdateMySchedulePollVoteRequest,
) => apiPut<SchedulePoll>(`/schedule-polls/${pollId}/votes/me`, body);

/** 일정 조율 투표 삭제(DELETE /schedule-polls/:pollId). 생성자·리더·부리더만 가능. */
export const deleteSchedulePoll = (pollId: string) =>
  apiDelete<{ schedulePollId: string }>(`/schedule-polls/${pollId}`);

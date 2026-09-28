import { useQuery } from '@tanstack/react-query';
import { getSchedulePoll, getSchedulePolls } from '../api';

export const schedulePollQueries = {
  all: ['schedule-polls'] as const,
  list: (spaceId: string) =>
    [...schedulePollQueries.all, 'list', spaceId] as const,
  detail: (pollId: string) =>
    [...schedulePollQueries.all, 'detail', pollId] as const,
};

/** 합주 공간의 일정 조율 투표 목록(최신 생성순). */
export const useSchedulePolls = (spaceId: string) =>
  useQuery({
    queryKey: schedulePollQueries.list(spaceId),
    queryFn: () => getSchedulePolls(spaceId),
    select: (data) => data.items,
    enabled: !!spaceId,
  });

/** 일정 조율 투표 상세(후보별 득표·투표자·내 선택). */
export const useSchedulePoll = (pollId: string) =>
  useQuery({
    queryKey: schedulePollQueries.detail(pollId),
    queryFn: () => getSchedulePoll(pollId),
    enabled: !!pollId,
  });

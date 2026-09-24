import { useQueries, useQuery } from '@tanstack/react-query';
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

/**
 * 목록 카드에 표시할 상세(후보 날짜 범위) 일괄 조회.
 * 목록 API는 optionCount만 주고 후보 시간을 주지 않아, 공간당 투표 수가
 * 적다는 전제(페이지네이션 없음)로 상세를 함께 받아 날짜를 그린다.
 */
export const useSchedulePollDetails = (pollIds: string[]) =>
  useQueries({
    queries: pollIds.map((pollId) => ({
      queryKey: schedulePollQueries.detail(pollId),
      queryFn: () => getSchedulePoll(pollId),
    })),
  });

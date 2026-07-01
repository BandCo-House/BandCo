import { apiGet } from '@/shared/api/client';
import { type GetSchedulesResponse, type ScheduleType } from '../model/types';

export interface ScheduleListFilter {
  /** 시작일시 이상 (ISO 8601) */
  from?: string;
  /** 시작일시 이하 (ISO 8601) */
  to?: string;
  /** 일정 유형 필터 (미지정 시 전체) */
  scheduleType?: ScheduleType;
}

/**
 * 백엔드 일정 목록 쿼리 파라미터 키. 백엔드 합의 시 이 한 곳만 수정한다.
 */
// TODO(백엔드): "내가 포함된 일정만 보기"는 현재 응답 isMine으로 클라이언트 필터링한다.
// 서버 측 필터(예: where__is_mine)를 제공하면 여기 키를 추가하고 buildScheduleParams에 반영한다.
const SCHEDULE_QUERY_KEYS = {
  from: 'where__start_at__greater_than_equal',
  to: 'where__start_at__less_than_equal',
  scheduleType: 'where__schedule_type',
} as const;

const buildScheduleParams = (
  filter: ScheduleListFilter,
): Record<string, string> => {
  const params: Record<string, string> = {};
  if (filter.from) params[SCHEDULE_QUERY_KEYS.from] = filter.from;
  if (filter.to) params[SCHEDULE_QUERY_KEYS.to] = filter.to;
  if (filter.scheduleType)
    params[SCHEDULE_QUERY_KEYS.scheduleType] = filter.scheduleType;
  return params;
};

export const getSchedules = (
  spaceId: string,
  filter: ScheduleListFilter = {},
) =>
  apiGet<GetSchedulesResponse>(`/bandspaces/${spaceId}/schedules`, {
    params: buildScheduleParams(filter),
  });

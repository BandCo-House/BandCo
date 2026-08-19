import { apiGet, apiPatch, apiPost } from '@/shared/api/client';
import {
  type CreateScheduleRequest,
  type CreateScheduleResult,
  type GetSchedulesResponse,
  type ScheduleDetail,
  type ScheduleType,
  type UpdateScheduleRequest,
} from '../model/types';

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
 *
 * 곡·장소·팀 상세 필터와 "내가 포함된 일정만"은 서버에도 파라미터(where__place_id/team_id/is_mine)가
 * 있지만, 상세 필터가 다중 선택이고 토글 시 재요청 없이 즉시 반영돼야 해서 응답을 클라이언트에서 거른다.
 * 여기서는 fetch 범위를 정하는 날짜·유형만 서버로 보낸다.
 */
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

/** 일정 생성(POST /bandspaces/:spaceId/schedules). */
export const createSchedule = (spaceId: string, body: CreateScheduleRequest) =>
  apiPost<CreateScheduleResult>(`/bandspaces/${spaceId}/schedules`, body);

/** 일정 수정(PATCH /schedules/:scheduleId). */
export const updateSchedule = (
  scheduleId: string,
  body: UpdateScheduleRequest,
) => apiPatch<CreateScheduleResult>(`/schedules/${scheduleId}`, body);

/**
 * 일정 상세(GET /schedules/:scheduleId).
 * 백엔드가 `{ schedule: {...} }`로 감싸 주므로 schedule 본문만 꺼내 반환한다.
 */
export const getScheduleDetail = async (
  scheduleId: string,
): Promise<ScheduleDetail> => {
  const data = await apiGet<{ schedule: ScheduleDetail }>(
    `/schedules/${scheduleId}`,
  );
  return data.schedule;
};

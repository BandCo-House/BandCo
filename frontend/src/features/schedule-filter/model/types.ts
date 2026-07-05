import type { ScheduleType } from '@/entities/schedule/model/types';

/** 일정 유형 필터 값. undefined는 "전체"를 의미한다. */
export type ScheduleTypeFilter = ScheduleType | undefined;

export interface ScheduleTypeOption {
  label: string;
  value: ScheduleTypeFilter;
}

export const SCHEDULE_TYPE_OPTIONS: ScheduleTypeOption[] = [
  { label: '전체', value: undefined },
  { label: '합주', value: 'PRACTICE' },
  { label: '회의', value: 'MEETING' },
];

/**
 * 상세 필터(곡·장소·팀). 서버 필터 파라미터가 없어 응답을 클라이언트에서 거른다.
 * 팀은 목록 API(GET /bands/:bandId/teams)로 채우지만, 일정 목록 응답에 team이 없어
 * 타임라인 필터에는 아직 적용되지 않는다(백엔드: 일정 item에 team 추가 필요).
 */
export interface ScheduleDetailFilter {
  songIds: string[];
  placeIds: string[];
  teamIds: string[];
}

export const EMPTY_DETAIL_FILTER: ScheduleDetailFilter = {
  songIds: [],
  placeIds: [],
  teamIds: [],
};

export const countDetailFilter = (filter: ScheduleDetailFilter): number =>
  filter.songIds.length + filter.placeIds.length + filter.teamIds.length;

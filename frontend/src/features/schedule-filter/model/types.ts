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
 * 상세 필터(곡·장소·팀). 다중 선택이라 단일값 서버 파라미터 대신 응답(songs/place/team)을
 * 클라이언트에서 거른다. 팀 목록은 GET /bands/:bandId/teams로 채운다.
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

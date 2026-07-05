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

/** 상세 필터(곡·장소). 서버 필터 파라미터가 없어 응답을 클라이언트에서 거른다. */
export interface ScheduleDetailFilter {
  songIds: string[];
  placeIds: string[];
}

export const EMPTY_DETAIL_FILTER: ScheduleDetailFilter = {
  songIds: [],
  placeIds: [],
};

export const countDetailFilter = (filter: ScheduleDetailFilter): number =>
  filter.songIds.length + filter.placeIds.length;

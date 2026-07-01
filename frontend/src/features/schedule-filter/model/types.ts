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

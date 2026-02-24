export type ScheduleType = 'ensemble' | 'meeting';

export interface BaseSchedule {
  id: string;
  type: ScheduleType;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnsembleSchedule extends BaseSchedule {
  type: 'ensemble';
  place: string;
  songId: string;
  teamId: string | null;
}

export interface MeetingSchedule extends BaseSchedule {
  type: 'meeting';
  title: string;
  memberIds: string[];
  memo: string;
}

export type Schedule = EnsembleSchedule | MeetingSchedule;

export type { ScheduleType } from '@/entities/schedule/model/types';

export interface ScheduleCreateFormState {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  placeId: string | null;
  songId: string | null;
  teamId: string | null;
  participantUserIds: string[];
  memo: string;
}

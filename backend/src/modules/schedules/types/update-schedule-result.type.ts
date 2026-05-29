export interface UpdateScheduleResult {
  scheduleId: string;
  spaceId: string;
  scheduleType: string;
  title: string;
  startAt: string | null;
  endAt: string | null;
  placeId: string | null;
  status: string;
  songIds: string[];
  participantCount: number;
  memo: string | null;
  updatedAt: string;
}

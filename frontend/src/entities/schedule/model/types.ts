export type ScheduleType = 'PRACTICE' | 'MEETING';
export type ScheduleStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';

export interface ScheduleItem {
  scheduleId: string;
  spaceId: string;
  scheduleType: ScheduleType;
  title: string;
  startAt: string; // ISO 8601 (e.g., "2026-02-18T10:00:00Z")
  endAt: string;
  place: { name: string } | null;
  practice: {
    title: string;
    artistName: string;
    team: { name: string };
  } | null;
  meeting: {
    participantCount: number;
  } | null;
  ui: {
    cardTitle: string;
    cardSubTitle: string;
    colorToken: string;
  };
  status: ScheduleStatus;
}

export interface GetSchedulesResponse {
  items: ScheduleItem[];
}

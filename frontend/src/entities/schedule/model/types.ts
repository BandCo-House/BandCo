export type ScheduleType = 'PRACTICE' | 'PERFORMANCE' | 'MEETING' | 'ETC';
export type ScheduleStatus = 'SCHEDULED' | 'CANCELLED' | 'DONE';

export interface CreateScheduleRequest {
  title: string;
  scheduleType: ScheduleType;
  startAt: string; // ISO 8601
  endAt: string;   // ISO 8601
  placeId?: string;
  memo?: string;
  status: ScheduleStatus;
  // 연습(PRACTICE) 전용
  songId?: string;
  teamId?: string;
  // 회의(MEETING) 전용
  participantUserIds?: string[];
}

export interface ScheduleItem {
  scheduleId: string;
  spaceId: string;
  scheduleType: ScheduleType;
  title: string;
  startAt: string; // ISO 8601 (e.g., "2026-02-18T10:00:00Z")
  endAt: string;
  place: { name: string } | null;
  memo?: string;
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

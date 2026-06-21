import type { ScheduleSongItem } from './create-schedule-result.type';

export interface ScheduleParticipantDetail {
  participantId: string;
  bandMemberId: string;
  attendanceStatus: string | null;
  note: string | null;
}

export interface SchedulePlaceDetail {
  placeId: string;
  name: string;
  address: string;
}

export interface GetScheduleDetailResult {
  schedule: {
    scheduleId: string;
    spaceId: string;
    scheduleType: string;
    title: string;
    startAt: string | null;
    endAt: string | null;
    status: string;
    place: SchedulePlaceDetail | null;
    songs: ScheduleSongItem[];
    participants: ScheduleParticipantDetail[];
    memo: string | null;
    createdByBandMemberId: string;
    createdAt: string;
    updatedAt: string;
  };
}

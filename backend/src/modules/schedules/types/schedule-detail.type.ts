import type { ScheduleSongItem } from './create-schedule-result.type';
import type { ScheduleReferenceFileItem } from './schedule-reference-file.type';

export interface ScheduleParticipantDetail {
  participantId: string;
  bandMemberId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
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
    externalLinks: string[];
    referenceFiles: ScheduleReferenceFileItem[];
    createdByBandMemberId: string;
    isMine: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

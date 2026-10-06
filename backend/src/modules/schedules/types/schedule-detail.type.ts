import type { ScheduleSongItem } from './create-schedule-result.type';
import type { ScheduleReferenceFileItem } from './schedule-reference-file.type';

/** 이 일정에서 맡은 세션. 회의 참여자는 null이다. */
export interface ScheduleParticipantSkillType {
  skillTypeId: string;
  name: string;
}

export interface ScheduleParticipantDetail {
  participantId: string;
  bandMemberId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  attendanceStatus: string | null;
  note: string | null;
  skillType: ScheduleParticipantSkillType | null;
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

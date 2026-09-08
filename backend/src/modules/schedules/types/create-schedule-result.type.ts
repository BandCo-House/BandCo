import type { ScheduleReferenceFileItem } from './schedule-reference-file.type';

export interface ScheduleSongItem {
  songId: string;
  title: string;
  artistName: string;
  /** 곡 키(SongKey enum 값). 미입력이면 null. */
  key: string | null;
}

export interface CreateScheduleResult {
  scheduleId: string;
  spaceId: string;
  placeId: string | null;
  createdByBandMemberId: string;
  scheduleType: string;
  title: string;
  startAt: string | null;
  endAt: string | null;
  status: string;
  songs: ScheduleSongItem[];
  participantCount: number;
  teamId: string | null;
  memo: string | null;
  externalLinks: string[];
  referenceFiles: ScheduleReferenceFileItem[];
  createdAt: string;
}

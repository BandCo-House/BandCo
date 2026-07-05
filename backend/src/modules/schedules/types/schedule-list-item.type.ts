import type { ScheduleSongItem } from './create-schedule-result.type';

export interface SpaceScheduleListItem {
  scheduleId: string;
  spaceId: string;
  scheduleType: string;
  title: string;
  startAt: string | null;
  endAt: string | null;
  place: { placeId: string; name: string } | null;
  songs: ScheduleSongItem[];
  participantCount: number;
  participants: ScheduleParticipantAvatar[];
  memo: string | null;
  status: string;
  isMine: boolean;
}

export interface ScheduleParticipantAvatar {
  userId: string;
  avatarUrl: string | null;
}

export interface ScheduleListCursor {
  startAt: string;
  id: string;
}

export interface ScheduleListMeta {
  count: number;
  take: number;
  cursor: ScheduleListCursor | null;
  next: string | null;
}

export interface GetSpaceSchedulesResult {
  items: SpaceScheduleListItem[];
  meta: ScheduleListMeta;
}

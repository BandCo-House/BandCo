export interface ScheduleSongItem {
  songId: string;
  title: string;
  artistName: string;
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
  createdAt: string;
}
